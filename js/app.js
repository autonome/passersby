'use strict';

window.addEventListener('DOMContentLoaded', function() {

  /*
  var translate = navigator.mozL10n.get;
  navigator.mozL10n.once(function start() {
  })
  */

  function classify(selector, classesToAdd, classesToRemove) {
    var els = document.querySelectorAll(selector)
    //console.log('matches for', selector, els.length, 'adding:', classesToAdd, 'removing:', classesToRemove)
    for (var i = 0; i < els.length; i++) {
      if (classesToAdd)
        classesToAdd.forEach(function(c) { els[i].classList.add(c) })
      if (classesToRemove)
        classesToAdd.forEach(function(c) { els[i].classList.add(c) })
    }
  }

  var socket = io.connect('http://metafluff.com:9001'),
      playerId = navigator.mediaDevices ? 'Player-' + Date.now() : null,
      gStream = null // FIXME

  if (playerId) {
    classify('#start', ['animated', 'fadeIn', 'visible'])
    classify('#qrcode-container', ['hidden'])
    classify('#instructions', ['hidden'])
    classify('#app_title', ['hidden'])

    var start = document.querySelector('#start')
    start.onclick = function() {
      var vid = document.querySelector('#vid')
      vid.style.display = 'block'
      startRecording()
    }

    var snap = document.querySelector('#snap')
    snap.onclick = takePicture
  }
  else {
    // start webserver
    //startListen()

    classify('#start', ['hidden'])
    classify('#snap', ['hidden'])
  }


  socket.on('player', function (data) {
    addPlayerElement(data.player)
  })

  var qrcode = new QRCode('qrcode', {
    text: 'http://people.mozilla.com/~dietrich/tv',
    width: 128,
    height: 128,
    colorDark : '#000000',
    colorLight : '#ffffff',
    correctLevel : QRCode.CorrectLevel.H
  });

  function getRandomCoordinates(container) {
    var fullWidth = window.innerWidth;
    var fullHeight = window.innerHeight;
    //var fullWidth = container ? container.width : window.innerWidth;
    //var fullHeight = container ? container.height : window.innerHeight;
    return {
      x: Math.round(Math.random() * fullWidth) + "px",
      y: Math.round(Math.random() * fullHeight) + "px"
    }
  }

  function addPlayerElement(player) {
    var el = document.querySelector('#' + player.id)
    if (!el) {
      el = document.createElement("div")
      document.body.appendChild(el);
      el.setAttribute('id', player.id)
      el.textContent = player.id;
      el.style.position = "absolute";
      var coords = getRandomCoordinates()
      el.style.left = coords.x
      el.style.top = coords.y
      el.style.backgroundColor = 'orange'
      el.classList.add('player', 'animated', 'bounceIn')
    }
    if (player.photoURL)
      el.style.background = 'url(' + player.photoURL + ')'
  }

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
      gStream = stream
      var vidEl = document.querySelector('#vid')
      vidEl.src = window.URL.createObjectURL(stream)
      vidEl.play()
      /*
      vidEl.onloadedmetadata = function(e) {
        var qrdc = new QCodeDecoder()
        qrdc.decodeFromVideo(vidEl, function (err) {
          if (err) throw err;
          alert(result);
        })
      }
      */
    })
    .catch(function(err) {
      console.log(err.name + ": " + err.message);
    })
  }

  function takePicture() {
    var canvas = document.querySelector('#canvas')
    var video = document.querySelector('#vid')
    var context = canvas.getContext('2d')
    var width = 320;
    var height = video.videoHeight / (video.videoWidth/width);
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
    
      gStream.stop()
      video.style.display = 'none'

      var data = canvas.toDataURL('image/png');
      canvas.style.display = 'block'

      // send photo to server
      socket.emit('player', {
        player: {
          id: playerId,
          photoURL: data
        }
      })
    } else {
      // TODO
    }
  }
});

function startListen(){
  console.log("Initializing server");
  var socketServer = navigator.mozTCPSocket.listen(8008);

  socketServer.onconnect = function(conn){
    console.log("connected", conn);
    conn.send("Ok. Got client on: ", conn.port);
    conn.ondata = function(ev){
      console.log("Got request: ", ev);   
    };
    conn.onclose = function(ev){
      console.log("Client left:", ev);
    }
    conn.close();
  }
  socketServer.onerror = function(ev){
    console.log("Failed to start: ", ev);
  }
}
