import json
import os
import smtplib
from email.message import EmailMessage
from datetime import datetime


class BookingManager:
    def __init__(self, data_file="bookings.json"):
        self.data_file = data_file
        self.bookings = self._load_bookings()
        
        # Email settings
        self.email_user = "queencityblendzzz@gmail.com"
        self.email_from = "QCB ALERTS"
        self.email_password = "gbxvxsmsthjiegyy"
        self.notification_to = "9808339861@vtext.com"  # SMS gateway
    
    def _load_bookings(self):
        """Load bookings from JSON file if it exists."""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading bookings: {e}")
                return []
        return []
    
    def _save_bookings(self):
        """Save bookings to JSON file."""
        try:
            with open(self.data_file, 'w') as f:
                json.dump(self.bookings, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving bookings: {e}")
            return False
    
    def add_booking(self, booking_data):
        """Add a new booking and send notification."""
        # Generate a booking ID
        booking_id = f"booking_{len(self.bookings) + 1}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Add timestamp
        booking = {
            "id": booking_id,
            "created_at": datetime.now().isoformat(),
            **booking_data
        }
        
        # Add to bookings list
        self.bookings.append(booking)
        
        # Save to file
        saved = self._save_bookings()
        
        # Send notification
        if saved:
            self._send_notification(booking)
        
        return saved, booking_id
    
    def get_bookings(self, date=None):
        """Get all bookings or filtered by date."""
        if date:
            return [booking for booking in self.bookings if booking.get("date") == date]
        return self.bookings
    
    def get_booking(self, booking_id):
        """Get a specific booking by ID."""
        for booking in self.bookings:
            if booking.get("id") == booking_id:
                return booking
        return None
    
    def update_booking(self, booking_id, updated_data):
        """Update an existing booking."""
        for i, booking in enumerate(self.bookings):
            if booking.get("id") == booking_id:
                # Update booking data while preserving id and created_at
                booking_id = booking.get("id")
                created_at = booking.get("created_at")
                
                self.bookings[i] = {
                    "id": booking_id,
                    "created_at": created_at,
                    **updated_data
                }
                
                return self._save_bookings()
        return False
    
    def delete_booking(self, booking_id):
        """Delete a booking by ID."""
        for i, booking in enumerate(self.bookings):
            if booking.get("id") == booking_id:
                self.bookings.pop(i)
                return self._save_bookings()
        return False
    
    def _send_notification(self, booking):
        """Send email notification about new booking."""
        try:
            # Format the email body
            body = f"""
New Appointment Request:
ID: {booking.get('id')}
Name: {booking.get('firstName')} {booking.get('lastName')}
"""
            # Add Instagram if available, otherwise add phone
            if booking.get('instagram'):
                body += f"Instagram: {booking.get('instagram')}\n"
            else:
                body += f"Phone: {booking.get('phone')}\n"
                
            body += f"""Service: Haircut - $15
Date: {booking.get('date')}
Time: {booking.get('time')}
            """.strip()
            
            self.send_alert("New Appointment Request", body, self.notification_to)
            return True
        except Exception as e:
            print(f"Error sending notification: {e}")
            return False
    
    def send_alert(self, subject, body, to):
        """Send email alert using SMTP."""
        msg = EmailMessage()
        msg.set_content(body)
        msg['subject'] = subject
        msg['to'] = to
        msg['from'] = self.email_from
        
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(self.email_user, self.email_password)
        server.send_message(msg)
        server.quit()


# Example usage
if __name__ == "__main__":
    # Initialize booking manager
    manager = BookingManager()
    
    # Example of adding a booking
    booking_data = {
        "firstName": "John",
        "lastName": "Smith",
        "instagram": "@johnsmith",
        "service": "haircut",
        "date": "2023-03-25",
        "time": "10:00 AM"
    }
    
    # Example with phone instead of Instagram
    booking_data_alt = {
        "firstName": "Jane",
        "lastName": "Doe",
        "phone": "555-123-4567",
        "service": "haircut",
        "date": "2023-03-25",
        "time": "2:00 PM"
    }
    
    success, booking_id = manager.add_booking(booking_data)
    if success:
        print(f"Booking added successfully with ID: {booking_id}")
    else:
        print("Failed to add booking")
    
    # Example of retrieving bookings
    all_bookings = manager.get_bookings()
    print(f"Total bookings: {len(all_bookings)}")
    
    # Example of retrieving bookings for a specific date
    date_bookings = manager.get_bookings(date="2023-03-25")
    print(f"Bookings for 2023-03-25: {len(date_bookings)}") 