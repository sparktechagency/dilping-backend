export type IDashboardFilterable ={
    searchTerm?: string
    name?: string
    lastName?: string
    role?: string
    businessName?: string
    category?: string
    subCategory?: string
    address?: string
    city?: string
    zipCode?: string
}


export interface IBookingFilter{
    searchTerm?: string
    status?: string
    category?: string
    subCategory?: string
    businessName?: string
    address?: string
    offerTitle?: string
    offerDescription?: string
    
}

export const BookingSearchableFields = ['offerTitle', 'offerDescription', 'category', 'subCategory', 'businessName', 'address', 'offerTitle', 'offerDescription']

export const BookingFilterableFields = ['status', 'category', 'subCategory',]

export const DashboardSearchableFields = ['name', 'lastName', 'businessName', 'address', 'city', 'zipCode', 'role']

export const DashboardFilterableFields = ['category', 'subCategory', 'role']
