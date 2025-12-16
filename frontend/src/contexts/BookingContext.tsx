import React, { createContext, useContext, useState, ReactNode } from 'react';

// Simplified context for placeholder purposes
interface BookingContextType {
    // Add properties as needed
    bookingData: any;
    setBookingData: (data: any) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [bookingData, setBookingData] = useState<any>(null);

    return (
        <BookingContext.Provider value={{ bookingData, setBookingData }}>
            {children}
        </BookingContext.Provider>
    );
};

export const useBooking = () => {
    const context = useContext(BookingContext);
    if (context === undefined) {
        throw new Error('useBooking must be used within a BookingProvider');
    }
    return context;
};
