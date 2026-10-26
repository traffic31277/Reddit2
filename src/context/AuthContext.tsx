import React, { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { getCurrentUser, AuthUser } from 'aws-amplify/auth';

// Define the items that you want to keep context of, these will be passed to all other elements within this header
interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    setUser: (user: AuthUser | null) => void;
}

// Creating the context, which is like a radio tower. Will continually updates to its values to all the children elements
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Within the children it will update these values and all children can call the checkUser, and setUser functions
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const checkUser = async () => {
        try {
            const user = await getCurrentUser();
            console.log("Success! User found: ", user);
            return user;
        }

        catch (err: any) {
            console.error("Failed! No user found: ", err);
        }

        finally {
            setLoading(false);
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook that all children elements can call
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}