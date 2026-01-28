import express from 'express'
import bcrypt from 'bcryptjs'
import * as XLSX from 'xlsx'
import User from '../models/User.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { sendAccountDeactivatedEmail, sendAccountReactivatedEmail } from '../services/emailService.js'

const router = express.Router()

router.use(authenticateToken)
router.use(requireAdmin)

router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const search = req.query.search || ''
    const roleFilter = req.query.role || 'all'
    const skip = (page - 1) * limit

    let query = { role: { $in: ['student', 'faculty'] } }

    if (roleFilter !== 'all') {
      query.role = roleFilter
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i')
      query.$or = [
        { uid: searchRegex },
        { lastName: searchRegex },
        { givenName: searchRegex },
        { middleName: searchRegex },
        { email: searchRegex },
        { name: searchRegex }
      ]
      if (roleFilter !== 'all') {
        query = {
          $and: [
            { role: roleFilter },
            { $or: query.$or }
          ]
        }
      } else {
        query = {
          $and: [
            { role: { $in: ['student', 'faculty'] } },
            { $or: query.$or }
          ]
        }
      }
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -previousPassword -resetOtp -competencies -progress')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ])

    const formattedUsers = users.map(user => {
      let fullName = user.name
      if (user.lastName && user.givenName) {
        fullName = user.middleName 
          ? `${user.lastName}, ${user.givenName} ${user.middleName}`
          : `${user.lastName}, ${user.givenName}`
      }
      
      return {
        _id: user._id,
        uid: user.uid || user.student_id || '—',
        fullName,
        email: user.email,
        role: user.role,
        yearLevelAndSection: user.role === 'student' ? (user.yearLevelAndSection || user.yearSection || '—') : '—',
        createdAt: user.createdAt,
        isActive: user.isActive !== false
      }
    })

    res.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ message: 'Failed to fetch users' })
  }
})

router.post('/users', async (req, res) => {
  try {
    const { uid, lastName, givenName, middleName, email, role, yearLevelAndSection } = req.body
    const normalizedUid = String(uid || '').trim()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedLastName = String(lastName || '').trim()
    const normalizedGivenName = String(givenName || '').trim()
    const normalizedMiddleName = String(middleName || '').trim()
    const normalizedRole = String(role || '').trim().toLowerCase()
    const normalizedYearLevelAndSection = String(yearLevelAndSection || '').trim()

    if (!normalizedUid || !normalizedLastName || !normalizedGivenName || !normalizedEmail || !normalizedRole) {
      return res.status(400).json({ message: 'Required fields: uid, lastName, givenName, email, role' })
    }

    if (!['student', 'faculty'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Role must be student or faculty' })
    }

    if (normalizedRole === 'student' && !normalizedYearLevelAndSection) {
      return res.status(400).json({ message: 'Year Level & Section is required for students' })
    }

    const existingEmail = await User.findOne({ email: normalizedEmail })
    if (existingEmail) {
      return res.status(409).json({
        message: 'Email already exists',
        conflict: { type: 'email', value: normalizedEmail, id: existingEmail._id, role: existingEmail.role }
      })
    }

    const existingUid = await User.findOne({ uid: normalizedUid })
    if (existingUid) {
      return res.status(409).json({
        message: 'UID already exists',
        conflict: { type: 'uid', value: normalizedUid, id: existingUid._id, role: existingUid.role }
      })
    }

    const name = normalizedMiddleName 
      ? `${normalizedLastName}, ${normalizedGivenName} ${normalizedMiddleName}`
      : `${normalizedLastName}, ${normalizedGivenName}`

    const defaultPassword = normalizedUid
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    const newUser = new User({
      uid: normalizedUid,
      lastName: normalizedLastName,
      givenName: normalizedGivenName,
      middleName: normalizedMiddleName || null,
      email: normalizedEmail,
      name,
      role: normalizedRole,
      yearLevelAndSection: normalizedRole === 'student' ? normalizedYearLevelAndSection : null,
      student_id: normalizedRole === 'student' ? normalizedUid : null,
      password: hashedPassword
    })

    await newUser.save()

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: newUser._id,
        uid: newUser.uid,
        fullName: name,
        email: newUser.email,
        role: newUser.role,
        yearLevelAndSection: newUser.yearLevelAndSection || '—'
      }
    })
  } catch (error) {
    if (error?.code === 11000) {
      const key = error?.keyValue ? Object.keys(error.keyValue)[0] : undefined
      const value = error?.keyValue?.[key]
      return res.status(409).json({
        message: `${key === 'email' ? 'Email' : 'UID'} already exists`,
        conflict: { type: key || 'unknown', value }
      })
    }
    console.error('Error creating user:', error)
    res.status(500).json({ message: 'Failed to create user' })
  }
})

router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { isActive } = req.body

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot modify admin account status' })
    }

    user.isActive = isActive
    if (!isActive) {
      user.deactivatedAt = new Date()
      user.deactivatedBy = req.user.id
    } else {
      user.deactivatedAt = null
      user.deactivatedBy = null
    }

    await user.save()

    if (user.email) {
      const userName = user.givenName || user.name || 'User'
      if (!isActive) {
        sendAccountDeactivatedEmail(user.email, userName).catch(err => {
          console.error('Failed to send deactivation email:', err)
        })
      } else {
        sendAccountReactivatedEmail(user.email, userName).catch(err => {
          console.error('Failed to send reactivation email:', err)
        })
      }
    }

    res.json({
      message: isActive ? 'User activated successfully' : 'User deactivated successfully',
      user: {
        _id: user._id,
        uid: user.uid,
        isActive: user.isActive
      }
    })
  } catch (error) {
    console.error('Error updating user status:', error)
    res.status(500).json({ message: 'Failed to update user status' })
  }
})

router.get('/users/template', async (req, res) => {
  try {
    const templateData = [
      {
        UID: '',
        LastName: '',
        GivenName: '',
        MiddleName: '',
        Email: '',
        YearLevelAndSection: '',
        Role: ''
      },
      {
        UID: '2024-00001',
        LastName: 'Dela Cruz',
        GivenName: 'Juan',
        MiddleName: 'Miguel',
        Email: 'juan.delacruz@example.com',
        YearLevelAndSection: '3-A',
        Role: 'student'
      },
      {
        UID: 'FAC-001',
        LastName: 'Santos',
        GivenName: 'Maria',
        MiddleName: '',
        Email: 'maria.santos@example.com',
        YearLevelAndSection: '',
        Role: 'faculty'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Users')

    ws['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 30 },
      { wch: 20 },
      { wch: 10 }
    ]

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=akodemy_users_template.xlsx')
    res.send(buffer)
  } catch (error) {
    console.error('Error generating template:', error)
    res.status(500).json({ message: 'Failed to generate template' })
  }
})

router.post('/users/bulk', async (req, res) => {
  try {
    if (!req.body.fileData) {
      return res.status(400).json({ message: 'No file data provided' })
    }

    if (typeof req.body.fileData !== 'string' || !req.body.fileData.trim()) {
      return res.status(400).json({ message: 'Invalid file data provided' })
    }

    const base64Data = req.body.fileData.includes(',')
      ? req.body.fileData.split(',')[1]
      : req.body.fileData

    let buffer
    try {
      buffer = Buffer.from(base64Data, 'base64')
    } catch (error) {
      return res.status(400).json({ message: 'Invalid base64 file data' })
    }

    let wb
    try {
      wb = XLSX.read(buffer, { type: 'buffer' })
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or unsupported Excel file' })
    }

    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return res.status(400).json({ message: 'Excel file contains no sheets' })
    }

    const ws = wb.Sheets[wb.SheetNames[0]]
    
    const REQUIRED_HEADERS = ['UID', 'LastName', 'GivenName', 'MiddleName', 'Email', 'YearLevelAndSection', 'Role']
    const headerRow = XLSX.utils.sheet_to_json(ws, { header: 1 })[0]
    
    if (!headerRow || headerRow.length < REQUIRED_HEADERS.length) {
      return res.status(400).json({ 
        message: `Invalid Excel format. Required columns in exact order: ${REQUIRED_HEADERS.join(', ')}` 
      })
    }
    
    for (let i = 0; i < REQUIRED_HEADERS.length; i++) {
      if (String(headerRow[i]).trim() !== REQUIRED_HEADERS[i]) {
        return res.status(400).json({ 
          message: `Column ${i + 1} must be "${REQUIRED_HEADERS[i]}" but found "${headerRow[i] || 'empty'}". Required order: ${REQUIRED_HEADERS.join(', ')}` 
        })
      }
    }
    
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' })
    }

    const errors = []
    const validUsers = []
    const uidSet = new Set()
    const emailSet = new Set()

    const existingEmails = await User.find({}).select('email').lean()
    const existingUids = await User.find({ uid: { $ne: null } }).select('uid').lean()
    const dbEmails = new Set(existingEmails.map(u => u.email.toLowerCase()))
    const dbUids = new Set(existingUids.map(u => u.uid))

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2
      const rowErrors = []

      const uid = String(row.UID || '').trim()
      const lastName = String(row.LastName || '').trim()
      const givenName = String(row.GivenName || '').trim()
      const middleName = String(row.MiddleName || '').trim()
      const email = String(row.Email || '').trim().toLowerCase()
      const yearLevelAndSection = String(row.YearLevelAndSection || '').trim()
      const role = String(row.Role || '').trim().toLowerCase()

      if (!uid) rowErrors.push({ column: 'UID', reason: 'UID is required' })
      if (!lastName) rowErrors.push({ column: 'LastName', reason: 'Last Name is required' })
      if (!givenName) rowErrors.push({ column: 'GivenName', reason: 'Given Name is required' })
      if (!email) rowErrors.push({ column: 'Email', reason: 'Email is required' })
      if (!role) rowErrors.push({ column: 'Role', reason: 'Role is required' })

      if (role && !['student', 'faculty'].includes(role)) {
        rowErrors.push({ column: 'Role', reason: 'Role must be "student" or "faculty"' })
      }

      if (role === 'student' && !yearLevelAndSection) {
        rowErrors.push({ column: 'YearLevelAndSection', reason: 'Year Level & Section is required for students' })
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        rowErrors.push({ column: 'Email', reason: 'Invalid email format' })
      }

      if (uid && uidSet.has(uid)) {
        rowErrors.push({ column: 'UID', reason: 'Duplicate UID in file' })
      }

      if (email && emailSet.has(email)) {
        rowErrors.push({ column: 'Email', reason: 'Duplicate email in file' })
      }

      if (uid && dbUids.has(uid)) {
        rowErrors.push({ column: 'UID', reason: 'UID already exists in database' })
      }

      if (email && dbEmails.has(email)) {
        rowErrors.push({ column: 'Email', reason: 'Email already exists in database' })
      }

      if (rowErrors.length > 0) {
        errors.push({ row: rowNum, errors: rowErrors })
      } else {
        uidSet.add(uid)
        emailSet.add(email)
        
        const name = middleName 
          ? `${lastName}, ${givenName} ${middleName}`
          : `${lastName}, ${givenName}`

        validUsers.push({
          uid,
          lastName,
          givenName,
          middleName: middleName || null,
          email,
          name,
          role,
          yearLevelAndSection: role === 'student' ? yearLevelAndSection : null,
          student_id: role === 'student' ? uid : null
        })
      }
    }

    let insertedCount = 0
    if (validUsers.length > 0) {
      const usersToInsert = await Promise.all(validUsers.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.uid, 10)
        return { ...user, password: hashedPassword }
      }))
      
      const result = await User.insertMany(usersToInsert, { ordered: false })
      insertedCount = result.length
    }

    res.json({
      message: `Successfully added ${insertedCount} users`,
      inserted: insertedCount,
      skipped: errors.length,
      errors: errors
    })
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: 'Duplicate UID or email detected during insert' })
    }
    console.error('Error bulk uploading users:', error)
    res.status(500).json({ message: 'Failed to process bulk upload' })
  }
})

export default router
