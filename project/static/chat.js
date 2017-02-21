//SOCKET CONNECTION
let socket = io.connect('//' + document.domain + ':' + location.port);

var localVideo;
var remoteVideo;
var peerConnection;
var peerConnectionConfig = {
    'iceServers': [{
        'url': 'stun:stun.services.mozilla.com'
    }, {
        'url': 'stun:stun.l.google.com:19302'
    }]
};

navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;


//GET USER MEDIA
function pageReady() {
    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');



    var constraints = {
        video: true,
        audio: true,
    };

    if (navigator.getUserMedia) {
        navigator.getUserMedia(constraints, getUserMediaSuccess, getUserMediaError);
    } else {
        alert('Your browser does not support getUserMedia API');
    }
}

function getUserMediaSuccess(stream) {
    localStream = stream;
    localVideo.src = window.URL.createObjectURL(stream);
}

function getUserMediaError(error) {
    console.log(error);
}

pageReady();

//FUNCTION CALLED ON START BUTTON CLICK
function start(isCaller) {
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.onaddstream = gotRemoteStream;
    peerConnection.addStream(localStream);

    if (isCaller) {
        peerConnection.createOffer(gotDescription, createOfferError);
    }
}


function gotDescription(description) {
    console.log('got description');
    peerConnection.setLocalDescription(description, function () {
        socket.emit('video', JSON.stringify({
            'sdp': description
        }));
    }, function () {
        console.log('set description error')
    });
}

function gotIceCandidate(event) {
    if (event.candidate != null) {
        socket.emit('video', JSON.stringify({
            'ice': event.candidate
        }));
    }
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}

function createOfferError(error) {
    console.log(error);
}

//ANSWERING THE CliENt
function gotMessageFromServer(message) {
    if (!peerConnection) start(false);

    var signal = JSON.parse(message.data);
    if (signal.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp), function () {
            if (signal.sdp.type == 'offer') {
                peerConnection.createAnswer(gotDescription, createAnswerError);
            }
        });
    } else if (signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
    }
}









/* socket.on('connect', function() {
     socket.send('user connected');
 });

 socket.on('disconnect', function() {
     socket.send('user disconnected')
 });*/



socket.on('message', function (msg) {
    let username = $('#username_input').val();
    console.log(msg.username);
    console.log(username);
    if (msg.username === username) {
        console.log('username is what you entered')
        $('#messages').append('<li class="right"><span class ="span_right">' + msg.data + '</span></li><li class="buffer">li</li>');
        $("#messages").scrollTop($('#messages').height())
    } else {
        $('#messages').append('<li class="left"><span class ="span_left">' + msg.data + '</span></li><li class="buffer">li</li>');
        $("#messages").scrollTop($('#messages').height())
    }
});

socket.on('username_message', function (msg) {
    console.log('message received');
});

socket.on('video', function(message) {
    if (!peerConnection) start(false);

    var signal = JSON.parse(message.data);
    if (signal.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp), function () {
            if (signal.sdp.type == 'offer') {
                peerConnection.createAnswer(gotDescription, createAnswerError);
            }
        });
    } else if (signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
    }
});


$('#send_button').on('click', function () {
    socket.emit('message', {
        'data': $('#my_message').val()
    });
    $('#my_message').val("")
    console.log($('#my_message').val());
    return false;
});

$('#send_username_button').on('click', function () {
    socket.emit('username_message', {
        'data': $('#username_input').val()
    });
    console.log($('#username_input').val())
    return false;
});







//COPY URL TO CLIPBOARD
$('#link').text(window.location.href);
var copyBtn = document.querySelector('#copy');

copyBtn.addEventListener('click', function () {
    var link = document.querySelector('#link');

    // create a Range object
    var range = document.createRange();
    // set the Node to select the "range"
    range.selectNode(link);
    // add the Range to the set of window selections
    window.getSelection().addRange(range);

    // execute 'copy', can't 'cut' in this case
    document.execCommand('copy');
}, false);




//Hide Username Overlay On click
$('#send_username_button').on('click', function () {
    $('#username_overlay').css('visibility', 'hidden');
});

document.getElementById("username_input").focus();