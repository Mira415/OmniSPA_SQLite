# email_route.py
# Send appointment and confirmation emails
from flask import Blueprint, current_app
from flask_mail import Message

email_bp = Blueprint('email', __name__)

def send_appointment_confirmation(appointment, spa_owner_email):
    """Send appointment confirmation email to spa owner"""
    try:
        # Get mail instance from current app
        mail = current_app.extensions.get('mail')
        if not mail:
            current_app.logger.error("Mail extension not initialized")
            return False
            
        subject = f"New Appointment Booking - {appointment.customer_name}"
        
        # Format appointment details
        appointment_time = appointment.start_time.strftime('%Y-%m-%d %I:%M %p')
        total_duration = f"{appointment.duration} minutes"
        
        # Get services details
        services_list = "\n".join([
            f"- {service.service_name}: SCR {service.price}" 
            for service in appointment.services
        ])
        
        body = f"""
New Appointment Booking Notification

Dear Spa Owner,

A new appointment has been booked at your spa. Here are the details:

Customer Information:
- Name: {appointment.customer_name}
- Phone: {appointment.customer_phone}
- Notes: {appointment.customer_notes or 'None'}

Appointment Details:
- Date & Time: {appointment_time}
- Duration: {total_duration}
- Total Price: SCR {appointment.total_price}

Services Booked:
{services_list}

Booking Reference: Appointment number #{appointment.id}
Booked On: {appointment.created_at.strftime('%Y-%m-%d %I:%M %p')}

Please ensure you're prepared for this appointment.

Best regards,
Your Booking System
"""
        
        msg = Message(
            subject=subject,
            recipients=[spa_owner_email],
            body=body
        )
        mail.send(msg)
        current_app.logger.info(f"Appointment confirmation email sent to {spa_owner_email}")
        return True
        
    except Exception as e:
        current_app.logger.error(f"Failed to send appointment email: {str(e)}")
        return False

def send_customer_confirmation(appointment, customer_email):
    """Send appointment confirmation email to customer"""
    try:
        # Get mail instance from current app
        mail = current_app.extensions.get('mail')
        if not mail:
            current_app.logger.error("Mail extension not initialized")
            return False
            
        subject = f"Appointment Confirmation - {appointment.spa.name}"
        
        # Format appointment details
        appointment_time = appointment.start_time.strftime('%Y-%m-%d %I:%M %p')
        total_duration = f"{appointment.duration} minutes"
        
        # Get services details
        services_list = "\n".join([
            f"- {service.service_name}: SCR {service.price}" 
            for service in appointment.services
        ])
        
        body = f"""
Appointment Confirmation

Dear {appointment.customer_name},

Thank you for booking with {appointment.spa.name}. Here are your appointment details:

Appointment Information:
- Spa: {appointment.spa.name}
- Date & Time: {appointment_time}
- Duration: {total_duration}
- Total Price: SCR {appointment.total_price}

Services Booked:
{services_list}

Contact Information:
- Phone: {appointment.spa.phone}
- Address: {appointment.spa.address}

We look forward to seeing you! Please arrive 10 minutes before your scheduled time.

If you need to reschedule or cancel, please contact the spa directly.

Best regards,
The {appointment.spa.name} Team
"""
        
        msg = Message(
            subject=subject,
            recipients=[customer_email],
            body=body
        )
        mail.send(msg)
        current_app.logger.info(f"Appointment confirmation email sent to {customer_email}")
        return True
        
    except Exception as e:
        current_app.logger.error(f"Failed to send customer confirmation email: {str(e)}")
        return False