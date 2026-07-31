import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiEdit2, FiSearch, FiUserX, FiX } from 'react-icons/fi'
import { backendUrl } from '../App'
import ConfirmPopup from '../components/ConfirmPopup'
import './UserManagement.css'

const getUserInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map(word => word[0]?.toUpperCase()).join('') || 'U'
}

const getUserAvatar = (avatar) => {
  if (!avatar?.includes('/image/upload/')) return avatar
  return avatar.replace('/image/upload/', '/image/upload/c_fill,w_160,h_160,g_face/')
}

const UserManagement = ({ token }) => {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [disablingUser, setDisablingUser] = useState(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await axios.get(backendUrl + '/api/user/admin-list', { headers: { token } })
      if (response.data.success) setUsers(response.data.users)
      else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditUser = (user) => {
    setEditingUser(user)
    setName(user.name || '')
    setEmail(user.email || '')
  }

  const closeEditUser = () => {
    if (saving) return
    setEditingUser(null)
    setName('')
    setEmail('')
  }

  const updateUserHandler = async (event) => {
    event.preventDefault()

    if (!name.trim()) return toast.error('User name is required')
    if (!email.trim()) return toast.error('User email is required')

    try {
      setSaving(true)
      const response = await axios.post(backendUrl + '/api/user/admin-update', { id: editingUser._id, name: name.trim(), email: email.trim() }, { headers: { token } })

      if (response.data.success) {
        setUsers(prev => prev.map(user => user._id === response.data.user._id ? response.data.user : user))
        toast.success(response.data.message)
        setEditingUser(null)
        setName('')
        setEmail('')
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const disableUserHandler = async () => {
    if (!disablingUser || deletingId) return

    try {
      const userId = disablingUser._id
      setDeletingId(userId)
      const response = await axios.post(backendUrl + '/api/user/admin-delete', { id: userId }, { headers: { token } })

      if (response.data.success) {
        setUsers(prev => prev.filter(user => user._id !== userId))
        setDisablingUser(null)
        toast.success(response.data.message)
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setDeletingId('')
    }
  }

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return users

    return users.filter(user => user.name?.toLowerCase().includes(keyword) || user.email?.toLowerCase().includes(keyword))
  }, [users, search])

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className='user-management-page'>
      <div className='user-management-header'>
        <div>
          <h1>User Management</h1>
          <p>Review customer accounts and maintain their account information.</p>
        </div>
        <span>{users.length} Users</span>
      </div>

      <div className='user-management-toolbar'>
        <FiSearch />
        <input value={search} onChange={(event) => setSearch(event.target.value)} type='text' placeholder='Search user name or email...' />
      </div>

      <div className='user-management-list'>
        <div className='user-management-list-head'>
          <b>User</b>
          <b>Email</b>
          <b>Action</b>
        </div>

        {loading ? <div className='user-management-empty'>Loading users...</div> : filteredUsers.length === 0 ? <div className='user-management-empty'>Nothing found !</div> : filteredUsers.map(user => (
          <div key={user._id} className='user-management-row'>
            <div className='user-management-profile'>
              <div className='user-management-avatar'>
                {user.avatar ? <img src={getUserAvatar(user.avatar)} alt={user.name} /> : <span>{getUserInitials(user.name)}</span>}
              </div>
              <div>
                <p>{user.name}</p>
                <small>Customer account</small>
              </div>
            </div>

            <p className='user-management-email'>{user.email}</p>

            <div className='user-management-actions'>
              <button type='button' onClick={() => openEditUser(user)} className='user-management-edit-btn'><FiEdit2 /> Edit User</button>
              <button type='button' onClick={() => setDisablingUser(user)} disabled={deletingId === user._id} className='user-management-disable-btn'><FiUserX /> {deletingId === user._id ? 'Disabling...' : 'Disable User'}</button>
            </div>
          </div>
        ))}
      </div>

      {editingUser && (
        <div onMouseDown={closeEditUser} className='user-management-modal-overlay'>
          <form onSubmit={updateUserHandler} onMouseDown={(event) => event.stopPropagation()} className='user-management-modal'>
            <div className='user-management-modal-head'>
              <div>
                <small>Account Information</small>
                <h2>Edit User</h2>
              </div>
              <button type='button' onClick={closeEditUser}><FiX /></button>
            </div>

            <div className='user-management-modal-profile'>
              <div className='user-management-avatar'>
                {editingUser.avatar ? <img src={getUserAvatar(editingUser.avatar)} alt={editingUser.name} /> : <span>{getUserInitials(editingUser.name)}</span>}
              </div>
              <p>{editingUser.email}</p>
            </div>

            <label>
              <span>User Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} type='text' placeholder='Enter user name' />
            </label>

            <label>
              <span>Email Address</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type='email' placeholder='Enter email address' />
            </label>

            <div className='user-management-modal-actions'>
              <button type='button' onClick={closeEditUser}>Cancel</button>
              <button type='submit' disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      )}

      {disablingUser && (
        <ConfirmPopup
          title='Disable User?'
          message={`Are you sure you want to disable ${disablingUser.name}? This user will no longer be able to log in.`}
          confirmText='Disable User'
          loading={deletingId === disablingUser._id}
          onCancel={() => !deletingId && setDisablingUser(null)}
          onConfirm={disableUserHandler}
        />
      )}
    </div>
  )
}

export default UserManagement
