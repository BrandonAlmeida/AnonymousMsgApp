#!/bin/python3
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, send_from_directory
from flask_socketio import SocketIO, send, emit
from werkzeug.utils import secure_filename
import json
import os


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
app.config['UPLOAD_FOLDER'] = 'uploads/'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

socketio = SocketIO(app)

connected_users = 0

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        file_url = request.host_url + 'uploads/' + filename
        return jsonify({'success': 'File uploaded successfully', 'file_url': file_url})
    return jsonify({'error': 'Invalid file type'})

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'txt', 'mp3'}

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        password = request.form['password']
        if password == 'Sb.msg.3,1415':
            session['logged_in'] = True
            #session['username'] = request.form['username']
            return redirect(url_for('chat'))
        else:
            flash('Senha incorreta!')
    return render_template('login.html')

@app.route('/chat')
def chat():
    if not session.get('logged_in'):
        return redirect(url_for('index'))
    return render_template('chat.html')

@app.route('/logout')
def logout():
    session.clear()  # Limpa a sessão, removendo todas as suas chaves e valores
    return redirect(url_for('index'))

@socketio.on('connect')
def on_connect():
    global connected_users
    connected_users += 1
    emit('update user count', {'num_users': connected_users}, broadcast=True)

@socketio.on('disconnect')
def on_disconnect():
    global connected_users
    connected_users -= 1
    emit('update user count', {'num_users': connected_users}, broadcast=True)

@socketio.on('message')
def handleMessage(json_message):
    msg_data = json.loads(json_message)
    msg_data['ip'] = request.remote_addr
    send(json.dumps(msg_data), broadcast=True)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=61000)

