import { createContext, useContext, useEffect, useState } from 'react'
import { localDb } from '../lib/localDb'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

const SESSION_KEY = 'ecovibe_session'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAdminAuth, setIsAdminAuth] = useState(() => {
        return localStorage.getItem('ecovibe_admin') === 'true'
    })

    useEffect(() => {
        // Restore session from localStorage
        const savedUserId = localStorage.getItem(SESSION_KEY)
        if (savedUserId) {
            const prof = localDb.getById('profiles', savedUserId)
            if (prof) {
                setUser({ id: savedUserId })
                setProfile(prof)
            }
        }
        setLoading(false)
    }, [])

    function fetchProfile(userId) {
        const prof = localDb.getById('profiles', userId)
        setProfile(prof)
    }

    function signUp({ studentId, name, department, year, password }) {
        // Check if student ID already exists
        const existing = localDb.query('profiles', p => p.student_id === studentId)
        if (existing.length > 0) {
            throw new Error('An account with this Student ID already exists')
        }

        // Create the profile
        const newProfile = localDb.insert('profiles', {
            student_id: studentId,
            name,
            department,
            year: parseInt(year),
            password, // stored in localStorage (acceptable for demo/offline use)
            eco_points: 0,
            streak: 0,
            last_activity_date: null,
            role: 'student',
            avatar_url: null,
        })

        // Set session
        const usr = { id: newProfile.id }
        setUser(usr)
        setProfile(newProfile)
        localStorage.setItem(SESSION_KEY, newProfile.id)

        return { user: usr }
    }

    function signIn({ studentId, password }) {
        const profiles = localDb.query('profiles', p => p.student_id === studentId)
        if (profiles.length === 0) {
            throw new Error('Invalid credentials. No account found with this Student ID.')
        }
        const prof = profiles[0]
        if (prof.password !== password) {
            throw new Error('Invalid credentials. Incorrect password.')
        }

        const usr = { id: prof.id }
        setUser(usr)
        setProfile(prof)
        localStorage.setItem(SESSION_KEY, prof.id)
        return { user: usr }
    }

    function signOut() {
        setUser(null)
        setProfile(null)
        setIsAdminAuth(false)
        localStorage.removeItem(SESSION_KEY)
        localStorage.removeItem('ecovibe_admin')
    }

    function setAdminAuth(val) {
        setIsAdminAuth(val)
        if (val) localStorage.setItem('ecovibe_admin', 'true')
        else localStorage.removeItem('ecovibe_admin')
    }

    function adminLogout() {
        setIsAdminAuth(false)
        localStorage.removeItem('ecovibe_admin')
    }

    function updateProfile(updates) {
        if (!user) return
        const updated = localDb.update('profiles', user.id, updates)
        setProfile(updated)
        return updated
    }

    const value = {
        user,
        profile,
        loading,
        connectionError: false, // never a connection error with localStorage
        signUp,
        signIn,
        signOut,
        updateProfile,
        fetchProfile: () => user && fetchProfile(user.id),
        isAdmin: profile?.role === 'admin',
        isAdminAuth,
        setAdminAuth,
        adminLogout,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
