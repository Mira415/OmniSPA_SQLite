"""Managing spa bookings.
- Show available time slots for a spa
- Check if a time slot is free
- Booking an appointment"""

from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for, current_app
from app.models import db, Spa, Availability, Appointment, AppointmentService
from datetime import datetime, timedelta, timezone
import json
from app.routes.email_route import send_appointment_confirmation, send_customer_confirmation

UTC_PLUS_4 = timezone(timedelta(hours=4))# use timezone UTC+4 for Seychelles
booking_bp = Blueprint('booking', __name__)# Groups booking-related routes

@booking_bp.route('/api/spa/<int:spa_id>/availability')
def get_spa_availability(spa_id):
    """Get available time slots for a spa on a specific date"""
    spa = Spa.query.get_or_404(spa_id)# Looks up the spa
    
    # If the date is missing, return an error 400
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'error': 'Date parameter is required'}), 400
    
    try:# Convert "2025-09-05" into Python date object.
        booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    day_of_week = booking_date.weekday()
    day_name = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][day_of_week]
    
    # Looks up availability for a spa and the day
    availability = Availability.query.filter_by(spa_id=spa.id, day=day_name).first()
    
    if not availability:
        return jsonify({'available_slots': [], 'message': 'No availability set for this day'})
    
    if availability.is_closed:
        return jsonify({'available_slots': [], 'message': 'Spa is closed on this day'})
    
    # Fetch all appointments for this spa on this date.
    appointments = Appointment.query.filter(
        Appointment.spa_id == spa_id,
        db.func.date(Appointment.start_time) == booking_date
    ).all()
    
    # Calls calculate_available_slots to remove already booked slots and remove past slots (if booking today)
    available_slots = calculate_available_slots(
        availability.time_slots,
        appointments,
        booking_date
    )
    
    return jsonify({
        'available_slots': available_slots,
        'day': day_name
    })

def calculate_available_slots(availability_slots, appointments, booking_date):
    """Calculate available time slots - remove passed time slots and booked slots returns free slots"""
    available_slots = []
    
    if isinstance(booking_date, str):
        booking_date = datetime.strptime(booking_date, '%Y-%m-%d').date() # if date is text, convert to date
    
    if not availability_slots or not isinstance(availability_slots, list): # If no availability is set or the data is invalid return an empty list
        return available_slots
    
    def parse_time(time_str):
        """Tries to read the time (either in "02:30 PM" format or "14:30" format)"""
        try:
            return datetime.strptime(time_str.upper(), '%I:%M %p').time()
        except ValueError:
            try:
                return datetime.strptime(time_str, '%H:%M').time()
            except ValueError:
                return None
    
    # Filter appointments to only include those on the exact booking date
    appointments_on_date = [
        appt for appt in appointments 
        if appt.start_time.date() == booking_date
    ]
    
    # Turn booked appointments into time rangese eg: (10:00 to 11:00 is stored as {start: 10:00, end: 11:00})
    booked_slots = []
    for appt in appointments_on_date:
        appt_start = appt.start_time
        appt_end = appt_start + timedelta(minutes=appt.duration)
        booked_slots.append({
            'start': appt_start,
            'end': appt_end
        })
    
    # Get current time for today
    now = datetime.now(UTC_PLUS_4)
    is_today = (booking_date == now.date())
    
    # Convert now to timezone-naive for comparison with slot_end
    now_naive = now.replace(tzinfo=None)
    
    for slot in availability_slots:
        if not isinstance(slot, dict) or 'start' not in slot or 'end' not in slot:
            continue

        #Turns "09:00 AM" time into a real datetime object    
        start_time = parse_time(slot['start'])
        end_time = parse_time(slot['end'])
        
        if not start_time or not end_time:
            continue
            
        slot_start = datetime.combine(booking_date, start_time)
        slot_end = datetime.combine(booking_date, end_time)
        
        # If it’s today and the slot’s end time is already past → skip it.
        if is_today and slot_end <= now_naive:
            continue
        
        # Check if this slot overlaps with any booked appointment and marks as unavailable.
        slot_available = True
        for booked in booked_slots:
            if not (slot_end <= booked['start'] or slot_start >= booked['end']):
                slot_available = False
                break
        # Add the slot to the results if it’s free.
        if slot_available:
            available_slots.append({
                'start': slot['start'],
                'end': slot['end']
            })
    
    return available_slots

def is_timeslot_available(spa_id, requested_start, duration_minutes):
    """Check if a specific time slot is available for a spa, for final validation before booking"""
    requested_end = requested_start + timedelta(minutes=duration_minutes)
    
    # Get only appointments for the spa being booked and only appointments that start before the requested slot ends
    potential_conflicts = Appointment.query.filter(
        Appointment.spa_id == spa_id,
        Appointment.start_time < requested_end
    ).all()
    
    # Calculate its end time and checks if it overlaps with the requested slot
    for appointment in potential_conflicts:
        appointment_end = appointment.start_time + timedelta(minutes=appointment.duration)
        if appointment_end > requested_start:
            return False
    
    return True

@booking_bp.route('/spa/<int:spa_id>/book-appointment', methods=['POST'])
def book_appointment(spa_id):
    """Handle appointment booking submission"""
    try:
        spa = Spa.query.get_or_404(spa_id)
        
        # Check if all required fields exist
        required_fields = ['services', 'total', 'date', 'time', 'customerName', 'customerEmail', 'customerPhone']
        if not all(field in request.form for field in required_fields):
            # flash('Missing required booking information', 'error')
            return redirect(url_for('booking.book_spa', spa_id=spa_id))
        
        try:
            # Read the services
            services = json.loads(request.form['services'])
            if not services or not isinstance(services, list):
                raise ValueError("Invalid services data")
            # sum up duration of each service to get total appointment duration
            total_duration = sum(service.get('duration', 0) for service in services)
            
        except (json.JSONDecodeError, ValueError):
            # flash('Invalid services selection', 'error')
            return redirect(url_for('booking.book_spa', spa_id=spa_id))
        
        # make a datetime object for the appointment start
        appointment_start = datetime.strptime(
            f"{request.form['date']} {request.form['time']}",
            '%Y-%m-%d %H:%M'
        )
        appointment_start_utc4 = appointment_start.replace(tzinfo=UTC_PLUS_4)
        if not is_timeslot_available(spa_id, appointment_start, total_duration):
            # flash('Sorry, that time slot is no longer available. Please choose another time.', 'error')
            return redirect(url_for('booking.book_spa', spa_id=spa_id))
        
        # Save appointment details
        appointment = Appointment(
            spa_id=spa_id,
            customer_name=request.form['customerName'],
            customer_email=request.form['customerEmail'],
            customer_phone=request.form['customerPhone'],
            customer_notes=request.form.get('customerNotes', ''),
            start_time=appointment_start,
            duration=total_duration,
            total_price=float(request.form['total']),
            created_at=datetime.now(UTC_PLUS_4)
        )
        
        db.session.add(appointment)
        db.session.flush()
        
        # Save the services for this appointment
        for service in services:
            appointment_service = AppointmentService(
                appointment_id=appointment.id,
                service_id=service['id'],
                service_name=service['name'],
                price=service['price']
            )
            db.session.add(appointment_service)
        
        db.session.commit()

         # Send confirmation email to spa owner only
        try:
            # Get spa owner's email
            owner_email = spa.owner.email
            
            # Send email to spa owner
            send_appointment_confirmation(appointment, owner_email)
            # Send confirmation email to customer
            send_customer_confirmation(appointment, request.form['customerEmail'])
                
        except Exception as email_error:
            # Log email error but don't fail the booking
            current_app.logger.error(f"Email sending failed: {str(email_error)}")
        
        # flash('Your appointment has been booked successfully!', 'success')
        return redirect(url_for('profile.spa_profile', spa_id=spa_id))
    
    except Exception as e:
        db.session.rollback()
        flash('An error occurred while processing your booking. Please try again.', 'error')
        return redirect(url_for('booking.book_spa', spa_id=spa_id))

@booking_bp.route('/spa/<int:spa_id>/book')    
def book_spa(spa_id):
    """Booking an appointment"""
    spa = Spa.query.get_or_404(spa_id)
    
    today = datetime.today().date()
    max_date = today + timedelta(days=90)# allows bookings up to 90 days (3 months) from today
    
    return render_template('book.html', 
                         spa=spa,
                         min_date=today.strftime('%Y-%m-%d'),
                         max_date=max_date.strftime('%Y-%m-%d'))