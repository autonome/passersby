// DOMContentLoaded is fired once the document has been loaded and parsed,
// but without waiting for other external resources to load (css/images/etc)
// That makes the app more responsive and perceived as faster.
// https://developer.mozilla.org/Web/Reference/Events/DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {

  // We'll ask the browser to use strict code to help us catch errors earlier.
  // https://developer.mozilla.org/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode
  'use strict';

  var translate = navigator.mozL10n.get;

  // We want to wait until the localisations library has loaded all the strings.
  // So we'll tell it to let us know once it's ready.
  navigator.mozL10n.once(start);

  // ---

  function start() {
    // We're using textContent because inserting content from external sources into your page using innerHTML can be dangerous.
    // https://developer.mozilla.org/Web/API/Element.innerHTML#Security_considerations
    var message = document.getElementById('message');
    message.textContent = translate('message');
  }

  var socket = io.connect('http://metafluff.com:9001'),
      playerId = 'Player-' + Date.now()

  if (navigator.mediaDevices) {
    socket.emit('player', {
      player: {
        id: playerId
      }
    })
    startRecording()
  }

  socket.on('player', function (data) {
    //if (data.player.id != playerId)
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

  function getRandomCoordinates() {
    var fullWidth = window.innerWidth;
    var fullHeight = window.innerHeight;
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
      el.style.backgroundColor = 'pink'
      el.classList.add('player', 'animated', 'bounceInUp')
    }
    if (player.photoURL)
      el.style.background = 'url(' + player.photoURL + ')'
  }

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
      var vidEl = document.querySelector('#vid')
      vidEl.src = window.URL.createObjectURL(stream)
      vidEl.play()
      vidEl.onloadedmetadata = function(e) {
        /*
        var qrdc = new QCodeDecoder()
        qrdc.decodeFromVideo(vidEl, function (err) {
          if (err) throw err;
          alert(result);
        })
        */
        setInterval(takePicture, 1000)
      }
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
      context.drawImage(vid, 0, 0, width, height);
    
      var data = canvas.toDataURL('image/png');
      //photo.setAttribute('src', data);
      // update photo
      socket.emit('player', {
        player: {
          id: playerId,
          photoURL: data
        }
      })
    } else {
      clearphoto();
    }
  }

});
