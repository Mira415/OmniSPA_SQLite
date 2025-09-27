"""Edit Spa Profile"""

from flask import Blueprint, request, flash, redirect, url_for, abort, render_template, json, current_app
from flask_login import current_user, login_required
from app.models import db, Spa, OperatingHours, SpaImage, Availability, allowed_file
import os

edit_bp = Blueprint('edit', __name__)

@edit_bp.route('/spa/<int:spa_id>/edit', methods=['GET', 'POST'])
@login_required # Only logged-in users can access.
def edit_spa(spa_id):
    """Allowing owners to edit their spa profile"""
    spa = Spa.query.get_or_404(spa_id)
    owner = spa.owner
    
    user_obj = current_user._get_current_object()
    # Checks that the user has required attributes
    if not (hasattr(user_obj, 'username') or not (hasattr(user_obj, 'email'))):
        abort(403)
    # Ensures only the owner can edit their spa.
    owner = spa.owner
    if not (user_obj.username == owner.username and user_obj.email == owner.email):
        abort(403)
    # converts availability records into a JSON string so the frontend can use it easily
    availability_json = json.dumps([
        {
            'day': avail.day,
            'is_closed': avail.is_closed,
            'time_slots': avail.time_slots
        }
        for avail in spa.availability
    ])
    
    if request.method == 'POST':# Update details about the Spa
        try:
            spa.name = request.form.get('spaName', spa.name)
            spa.email = request.form.get('spaEmail', spa.email)
            spa.phone = request.form.get('spaPhone', spa.phone)
            spa.address = request.form.get('spaAddress', spa.address)
            spa.description = request.form.get('spaAbout', spa.description)
            
            weekday_hours = next((h for h in spa.operating_hours if h.day_type == 'weekday'), None)
            weekend_hours = next((h for h in spa.operating_hours if h.day_type == 'weekend'), None)
            
            if weekday_hours:
                weekday_hours.opening_time = request.form.get('weekdayOpen', weekday_hours.opening_time)
                weekday_hours.closing_time = request.form.get('weekdayClose', weekday_hours.closing_time)
            
            if weekend_hours:
                weekend_hours.opening_time = request.form.get('weekendOpen', weekend_hours.opening_time)
                weekend_hours.closing_time = request.form.get('weekendClose', weekend_hours.closing_time)
            
            # Remove profile image if requested, deletes the current primary image (both file & DB record)
            if request.form.get('remove_profile_image') == 'true':
                primary_image = next((img for img in spa.images if img.is_primary), None)
                if primary_image:
                    try:
                        file_path = os.path.join(current_app.root_path, 'static', primary_image.filepath)
                        if os.path.exists(file_path):
                            os.remove(file_path)
                        db.session.delete(primary_image)
                    except OSError:
                        pass
            # Upload new profile image
            elif 'profileImageUpload' in request.files:
                    file = request.files['profileImageUpload']
                    if file.filename != '' and allowed_file(file.filename):
                        existing_primary = next((img for img in spa.images if img.is_primary), None)
                        if existing_primary:
                            try:
                                os.remove(os.path.join(
                                    current_app.root_path,
                                    'static',
                                    existing_primary.filepath
                                ))
                                db.session.delete(existing_primary)# Deletes the old primary image if it exists
                            except OSError:
                                pass
                        # Creates a new image record (SpaImage) and marks it as primary
                        image = SpaImage.create_from_upload(
                            file=file,
                            spa_id=spa.id,
                            upload_folder=current_app.config['UPLOAD_FOLDER']
                        )
                        if image:
                            image.is_primary = True
                            db.session.add(image)
            
            if 'galleryUpload' in request.files:# Upload new gallery images
                for file in request.files.getlist('galleryUpload'):
                    if file.filename != '' and allowed_file(file.filename):
                        image = SpaImage.create_from_upload(
                            file=file,
                            spa_id=spa.id,
                            upload_folder=current_app.config['UPLOAD_FOLDER']
                        )
                        if image:
                            image.is_primary = False
                            db.session.add(image)
            # Delete selected gallery images    
            if 'delete_images' in request.form:
                for image_id in request.form.getlist('delete_images'):
                    image = SpaImage.query.get(image_id)
                    if image and image.spa_id == spa.id:
                        # remove both the file and the DB record
                        try:
                            os.remove(os.path.join(
                                current_app.root_path, 
                                'static', 
                                image.filepath
                            ))
                        except OSError:
                            pass
                        db.session.delete(image)
            # Update gallery captions
            if 'gallery_captions' in request.form:
                captions = request.form.getlist('gallery_captions')
                gallery_images = [img for img in spa.images if not img.is_primary]# Updates captions for non-primary gallery images
                gallery_images.sort(key=lambda x: x.id)
                image_ids = request.form.getlist('gallery_image_ids') 
                
                gallery_images = [img for img in spa.images if not img.is_primary]
                # matches gallery_image_ids with captions[]
                for image in gallery_images:
                    try:
                        ids = image_ids.index(str(image.id))
                        image.caption = captions[ids]
                    except ValueError:
                        continue
            # Update availability
            if 'availability' in request.form:# Updates daily availability with time slots or closure status
                try:
                    availability_data = json.loads(request.form['availability'])
                    
                    for day, data in availability_data.items():# Update each day’s closed/open status and time slots
                        availability = Availability.query.filter_by(
                            spa_id=spa.id,
                            day=day
                        ).first()
                        
                        if availability:
                            availability.is_closed = data['closed']
                            availability.time_slots = data['slots']
                        else:# creates new availability entries for days that don’t yet exist in the database
                            availability = Availability(
                                day=day,
                                is_closed=data['closed'],
                                time_slots=data['slots'],
                                spa_id=spa.id
                            )
                            db.session.add(availability)
                except Exception:
                    flash('Error saving availability settings', 'error')

            db.session.commit()
            #flash('Profile updated successfully!', 'success')
            db.session.refresh(spa)

            return redirect(url_for('profile.spa_profile', spa_id=spa.id))
            
        except Exception:
            db.session.rollback()
            flash('Error updating profile. Please try again.', 'error')
    
    return render_template('edit.html', spa=spa, availability_json=availability_json)