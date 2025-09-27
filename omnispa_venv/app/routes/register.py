"""New SPA Registration"""

from flask import Blueprint, request, jsonify, current_app
from flask_login import current_user, login_required
from app.models import db, Spa, OperatingHours, Service, SpaImage, Availability, allowed_file
from datetime import datetime
import json
import re

register_bp = Blueprint('register', __name__)

@register_bp.route('/register', methods=['POST'])
@login_required
def register_spa():
    """Registering a new Spa"""
    try:# Checks if all required fields are present and not empty
        required_fields = {
            'spaName': 'Spa Name',
            'spaDescription': 'Spa Description',
            'spaAddress': 'Spa Address',
            'spaPhone': 'Phone Number',
            'spaEmail': 'Email Address',
            'spaArea': 'Location Area',
            'weekdayOpening': 'Weekday Opening Time',
            'weekdayClosing': 'Weekday Closing Time',
            'weekendOpening': 'Weekend Opening Time',
            'weekendClosing': 'Weekend Closing Time'
        }
        
        missing_fields = []# holds names of fields that are completely absent from the form submission
        empty_fields = []# holds names of fields that exist in the form, but the user submitted them as empty strings
        
        for field, field_name in required_fields.items():
            if field not in request.form:
                missing_fields.append(field_name)# if an input like <input name="spaName"> doesn’t exist in the form, add to missing_fields
            elif not request.form[field].strip():
                empty_fields.append(field_name)# if an input exists but has no value like <input name="spaName" value=" "> then becomes empty after .strip(), add to empty_fields
        
        if missing_fields or empty_fields:# If either list has items, then the form submission is invalid
            error_messages = []
            if missing_fields:
                error_messages.append(f"Missing fields: {', '.join(missing_fields)}")
            if empty_fields:
                error_messages.append(f"Empty fields: {', '.join(empty_fields)}")
            
            return jsonify({
                'success': False,
                'message': ' '.join(error_messages),
                'missing_fields': missing_fields,
                'empty_fields': empty_fields
            }), 400
    
        # Email & phone validation
        if not re.match(r"[^@]+@[^@]+\.[^@]+", request.form['spaEmail']):
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400

        if not re.match(r"^[\d\s\+\-\(\)]{7,}$", request.form['spaPhone']):
            return jsonify({
                'success': False,
                'message': 'Invalid phone number format'
            }), 400
        # Creates a new Spa object
        spa = Spa(
            name=request.form['spaName'],
            description=request.form['spaDescription'],
            address=request.form['spaAddress'],
            phone=request.form['spaPhone'],
            email=request.form['spaEmail'],
            area=request.form['spaArea'],
            terms_accepted=request.form.get('termsCheck', 'false').lower() == 'true',
            created_at=datetime.utcnow(),
            owner_id=current_user.id
        )
        db.session.add(spa)
        db.session.flush()

        try:# Save operating hours
            weekday_hours = OperatingHours(
                day_type='weekday',
                opening_time=request.form['weekdayOpening'],
                closing_time=request.form['weekdayClosing'],
                spa_id=spa.id
            )
            weekend_hours = OperatingHours(
                day_type='weekend',
                opening_time=request.form['weekendOpening'],
                closing_time=request.form['weekendClosing'],
                spa_id=spa.id
            )
            db.session.add(weekday_hours)
            db.session.add(weekend_hours)
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Invalid operating hours: {str(e)}'
            }), 400

        if 'services' in request.form:
            try:# Loop through each service and save it
                services_data = json.loads(request.form['services'])
                for service_data in services_data:
                    service = Service(
                        category=service_data['category'],
                        name=service_data['name'],
                        description=service_data.get('description', ''),
                        duration=int(service_data['duration']),
                        price=float(service_data['price']),
                        spa_id=spa.id
                    )
                    db.session.add(service)
            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': 'Invalid services data'
                }), 400

        if 'availability' in request.form:# Save availability per day
            # Check if availability data exists in the form
            try:
                availability_data = json.loads(request.form['availability'])# Converts the JSON string into a Python dictionary.
                for day, data in availability_data.items():
                    # availability = Availability.query.filter_by(# Check if a record already exists in the database, returns first match if it exists
                    #     spa_id=spa.id,
                    #     day=day
                    # ).first()
                    
                    # if availability:
                    #     availability.is_closed = data['closed']
                    #     availability.time_slots = data['slots']

                    availability = Availability(
                        day=day,
                        is_closed=data['closed'],
                        time_slots=data['slots'],
                        spa_id=spa.id
                    )
                    db.session.add(availability)
            except Exception as e:
                pass

        if 'spaImages' in request.files:# Loops through uploaded files and saves them
            for file in request.files.getlist('spaImages'):
                if file.filename != '':
                    if not allowed_file(file.filename):# check its an allowed file type
                        continue
                    image = SpaImage.create_from_upload(# Save the uploaded file to the server
                        file=file,
                        spa_id=spa.id,
                        upload_folder=current_app.config['UPLOAD_FOLDER']
                    )
                    if image:# Adds the new SpaImage object to database session
                        db.session.add(image)

        db.session.commit()
        
        image_path = '/static/img/default_spa.jpg'# Chooses the default image for the spa profile picture
        if spa.images:
            image_path = spa.images[0].filepath

        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'spa_id': spa.id,
            'spa_name': spa.name,
            'spa_description': spa.description,
            'spa_image': image_path,
            'owner_id': current_user.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Server error during registration'
        }), 500