import { AuthContext } from './authContextValue';
import React, { useState, useEffect, type ReactNode } from 'react';
import { AuthService, type User } from '../services/AuthService';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkAuth = () => {
            const isAuth = AuthService.isAuthenticated();
            setIsAuthenticated(isAuth);
            if (isAuth) {
                setUser(AuthService.getUser());
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = () => {
        setIsAuthenticated(true);
        setUser(AuthService.getUser());
    };

    const logout = () => {
        AuthService.logout();
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
