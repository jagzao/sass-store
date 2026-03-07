import React from 'react';
import { expect, test, describe } from 'vitest';
import { render, screen } from '@testing-library/react';
import CalendarTimeline, { TimelineBooking } from '../../apps/web/app/t/[tenant]/admin/calendar/CalendarTimeline';

const mockBookings: TimelineBooking[] = [
  {
    id: "booking-1",
    customerName: "Jane Doe",
    serviceName: "Corte de Pelo",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    duration: 60,
    status: "confirmed",
    phone: "1234567890",
    totalPrice: 50.0,
    resourceId: "cabina-1"
  }
];

describe('CalendarTimeline Unit Tests', () => {

    test('renders without crashing', () => {
        const { container } = render(
            <CalendarTimeline 
                initialBookings={mockBookings} 
                currentDate={new Date()} 
                tenantSlug="test-tenant" 
            />
        );
        expect(container).toBeTruthy();
    });

    test('renders the booking customer name', () => {
        render(
            <CalendarTimeline 
                initialBookings={mockBookings} 
                currentDate={new Date()} 
                tenantSlug="test-tenant" 
            />
        );
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

});
