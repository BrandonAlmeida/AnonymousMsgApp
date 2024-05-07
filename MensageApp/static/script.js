var socket = io.connect('http://' + document.domain + ':' + location.port);
var currentUser = prompt("Digite seu nome de usuário:");

socket.on('update user count', function(data) {
    document.getElementById('user-count').textContent = 'Usuários conectados: ' + data.num_users;
});
// Carregar o arquivo de áudio
var notificationSound = new Audio('/static/notification.mp3');

socket.on('message', function(data) {
    var msgData = JSON.parse(data);
    var messageElement = document.createElement('div');
    var toggleButton = document.createElement('button');
    toggleButton.innerHTML = '<i class="fa fa-eye-slash" aria-hidden="true"></i>';
    toggleButton.className = 'toggle-visibility'
    // toggleButton.className = 'toggle-visibility';
    

    
    // Inicialmente, oculta a mensagem
    messageElement.style.display = 'none';
 
    toggleButton.onclick = function() {
        if (messageElement.style.display === 'none') {
            messageElement.style.display = 'block';
            //toggleButton.textContent = 'Ocultar'
            toggleButton.innerHTML = '<i class="fa-solid fa-eye"></i>';
        } else {
            messageElement.style.display = 'none';
            toggleButton.innerHTML = '<i class="fa fa-eye-slash" aria-hidden="true"></i>';
        }
    };

    if (msgData.type === 'file') {
        var link = document.createElement('a');
        link.href = msgData.message;
        link.textContent = 'Clique para abrir o anexo';
        link.target = '_blank';
        messageElement.appendChild(link);
    } else {
        messageElement.textContent = msgData.user + ': ' + msgData.message;
    }

    messageElement.className = msgData.user === currentUser ? 'my-message' : 'other-message';
    
    var container = document.createElement('div');
    container.className = msgData.user === currentUser ? 'toggle-my-message' : 'toggle-other-message';
    container.style.display = 'flex'; // Configurando o contêiner para usar display flex
    container.style.alignItems = 'center'; // Alinha verticalmente os itens no centro
    container.appendChild(messageElement);
    container.appendChild(toggleButton);

    if (container.className === 'toggle-other-message') {
        // Tocar o som de notificação para cada mensagem recebida
        notificationSound.play();
    }

    document.getElementById('messages').appendChild(container);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
});

function sendMessage() {
    var input = document.getElementById('user-message').value;
    socket.send(JSON.stringify({ message: input, user: currentUser }));
    document.getElementById('user-message').value = '';
};

// Adicione esta função no seu arquivo JavaScript existente
function sendAttachment() {
    var file = document.getElementById('file-input').files[0];
    if (file) {
        var formData = new FormData();
        formData.append('file', file);
        formData.append('username', currentUser);

        fetch('/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Success:', data);
                // Envia a URL do arquivo como uma mensagem para o chat
                var message = data.file_url;
                socket.emit('message', JSON.stringify({ user: currentUser, message: message, type: 'file' }));
            } else {
                console.error('Error:', data.error);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
}



