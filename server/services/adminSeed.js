import bcrypt from 'bcryptjs'
import User from '../models/User.js'

const DEFAULT_ADMIN = {
  uid: 'Admin',
  email: 'akodemy.aeoncarde@gmail.com',
  name: 'System Administrator',
  lastName: 'Administrator',
  givenName: 'System',
  middleName: '',
  role: 'admin',
  yearLevelAndSection: 'N/A'
}

const ADMIN_PASSWORD = 'Admin@2026'

export async function seedDefaultAdmin() {
  try {
    const existingAdmin = await User.findOne({ 
      $or: [
        { uid: DEFAULT_ADMIN.uid },
        { role: 'admin' }
      ]
    })

    if (existingAdmin) {
      console.log('Admin account already exists, skipping seed')
      return null
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)

    const adminUser = new User({
      ...DEFAULT_ADMIN,
      password: hashedPassword
    })

    await adminUser.save()
    console.log('Default admin account created successfully')
    return adminUser
  } catch (error) {
    console.error('Failed to seed admin account:', error.message)
    return null
  }
}
