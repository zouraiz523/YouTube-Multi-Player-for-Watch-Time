    // YouTube API variables
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    var players = [];
    var maxPlays = 50;
    var playerCounter = 0;
    var apiReady = false;
    var pendingPlayers = [];

    // Called when YouTube API is ready
    function onYouTubeIframeAPIReady() {
        console.log("YouTube API is ready");
        apiReady = true;
        // Create any pending players
        for (var i = 0; i < pendingPlayers.length; i++) {
            createYouTubePlayer(pendingPlayers[i].id, pendingPlayers[i].videoId);
        }
        pendingPlayers = [];
    }

    // Extract YouTube video ID from URL - Improved regex pattern
    function extractVideoId(url) {
        var patterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([^&#]+)/i,
            /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?&#]+)/i,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?&#]+)/i,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^?&#]+)/i,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/[^\/]+\/\?v=([^&#]+)/i
        ];
        
        for (var i = 0; i < patterns.length; i++) {
            var match = url.match(patterns[i]);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return false;
    }

    // Show error with animation
    function showError(message) {
        var errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.classList.add('active');
        
        setTimeout(function() {
            errorElement.classList.remove('active');
        }, 3000);
    }

    // Check if video ID is valid with a simple verification
    function isValidVideoId(videoId) {
        // YouTube video IDs are typically 11 characters
        return videoId && videoId.length === 11;
    }

    // Add a new player when button is clicked
    function addPlayer(url = null) {
        const videoUrl = url || document.getElementById('videoUrl').value.trim();

        if (!videoUrl) {
            showError("Please enter a YouTube URL");
            return;
        }

        const videoId = extractVideoId(videoUrl);
        if (!isValidVideoId(videoId)) {
            showError("Please enter a valid YouTube URL");
            return;
        }

        document.getElementById('errorMessage').textContent = "";
        document.getElementById('videoUrl').value = "";

        // Create player container
        const playerContainer = document.createElement('div');
        playerContainer.className = 'player-container';
        playerContainer.id = 'container-' + playerCounter;
        playerContainer.style.animationDelay = (playerCounter * 0.1) + 's';

        // Create player element
        const playerElement = document.createElement('div');
        playerElement.className = 'player';
        playerElement.id = 'player-' + playerCounter;

        // Create player info section
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info';

        // Create loading indicator
        const loadingElement = document.createElement('span');
        loadingElement.className = 'loading';

        // Create counter display
        const counterElement = document.createElement('div');
        counterElement.className = 'counter';
        counterElement.id = 'counter-' + playerCounter;
        counterElement.appendChild(loadingElement);
        counterElement.appendChild(document.createTextNode('0 / ' + maxPlays + ' plays'));

        // Create title element
        const titleElement = document.createElement('div');
        titleElement.className = 'video-title';
        titleElement.id = 'title-' + playerCounter;
        titleElement.textContent = 'Loading...';

        // Add all elements to the container
        playerInfo.appendChild(counterElement);
        playerInfo.appendChild(titleElement);
        playerContainer.appendChild(playerElement);
        playerContainer.appendChild(playerInfo);

        // Add container to the grid
        document.getElementById('playerGrid').appendChild(playerContainer);

        // Create YouTube player
        if (apiReady) {
            createYouTubePlayer('player-' + playerCounter, videoId);
        } else {
            pendingPlayers.push({
                id: 'player-' + playerCounter,
                videoId: videoId
            });
        }

        playerCounter++;
    }

    // Create a YouTube player with improved error handling
    function createYouTubePlayer(elementId, videoId) {
        var playerId = elementId;
        var index = parseInt(playerId.split('-')[1]);
        
        try {
            var player = new YT.Player(elementId, {
                height: '200',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'autoplay': 0,
                    'controls': 1,
                    'rel': 0,
                    'origin': window.location.origin, // Important for security
                    'mute': 1,  // Muted to allow autoplay
                    'enablejsapi': 1,
                    'modestbranding': 1
                },
                events: {
                    'onReady': function(event) {
                        // Update title when player is ready
                        var title = event.target.getVideoData().title;
                        var titleElement = document.getElementById('title-' + index);
                        if (titleElement) {
                            titleElement.textContent = title || "YouTube Video";
                        }
                        
                        // Remove loading indicator
                        var counterElement = document.getElementById('counter-' + index);
                        if (counterElement) {
                            counterElement.innerHTML = '0 / ' + maxPlays + ' plays';
                        }
                        
                        // Store player data
                        players.push({
                            player: event.target,
                            index: index,
                            videoId: videoId,
                            playCount: 0
                        });
                        
                        console.log("Player ready: " + videoId);
                    },
                    'onStateChange': function(event) {
                        handlePlayerStateChange(event, index);
                    },
                    'onError': function(event) {
                        handlePlayerError(event, index);
                    }
                }
            });
        } catch (error) {
            console.error("Error creating player:", error);
            showError("Error creating player: " + error.message);
        }
    }

    // Handle player errors
    function handlePlayerError(event, index) {
        var errorCode = event.data;
        var errorMessage = "Unknown error";
        
        // YouTube API error codes
        switch (errorCode) {
            case 2:
                errorMessage = "Invalid video ID";
                break;
            case 5:
                errorMessage = "HTML5 player error";
                break;
            case 100:
                errorMessage = "Video not found or removed";
                break;
            case 101:
            case 150:
                errorMessage = "Video embedding not allowed by owner";
                break;
        }
        
        console.error("Player error:", errorMessage, "Code:", errorCode);
        
        // Update title to show error
        var titleElement = document.getElementById('title-' + index);
        if (titleElement) {
            titleElement.textContent = "Error: " + errorMessage;
            titleElement.style.color = "red";
        }
        
        // Remove loading indicator
        var counterElement = document.getElementById('counter-' + index);
        if (counterElement) {
            counterElement.innerHTML = 'Video Unavailable';
            counterElement.style.color = "red";
        }
    }

    // Handle video state changes
    function handlePlayerStateChange(event, index) {
        // Find the player in our array
        var playerData = players.find(p => p.index === index);
        
        if (event.data == YT.PlayerState.ENDED) {
            if (playerData) {
                playerData.playCount++;
                
                // Update counter display
                var counterElement = document.getElementById('counter-' + index);
                if (counterElement) {
                    counterElement.textContent = playerData.playCount + ' / ' + maxPlays + ' plays';
                    
                    // Add pulse animation when counter updates
                    counterElement.style.animation = 'pulse 0.5s';
                    setTimeout(function() {
                        counterElement.style.animation = '';
                    }, 500);
                }
                
                // Replay if not reached max
                if (playerData.playCount < maxPlays) {
                    event.target.seekTo(0);
                    event.target.playVideo();
                }
            }
        }
    }

    // Start all videos with better error handling
    function startAllVideos() {
        maxPlays = parseInt(document.getElementById('playCount').value) || 50;
        
        if (players.length === 0) {
            showError("No videos added yet. Please add at least one video.");
            return;
        }
        
        // Update all counters with new max plays
        for (var i = 0; i < players.length; i++) {
            var counterElement = document.getElementById('counter-' + players[i].index);
            if (counterElement) {
                counterElement.textContent = players[i].playCount + ' / ' + maxPlays + ' plays';
            }
        }
        
        // Start all players with slight delay between each
        for (var i = 0; i < players.length; i++) {
            (function(index) {
                setTimeout(function() {
                    try {
                        players[index].player.playVideo();
                        
                        // Add highlight effect to playing container
                        var container = document.getElementById('container-' + players[index].index);
                        if (container) {
                            container.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.6)';
                            setTimeout(function() {
                                container.style.boxShadow = '';
                            }, 1000);
                        }
                    } catch (error) {
                        console.error("Error starting video:", error);
                    }
                }, index * 300);
            })(i);
        }
    }

    // Stop all videos
    function stopAllVideos() {
        if (players.length === 0) {
            return;
        }
        
        for (var i = 0; i < players.length; i++) {
            try {
                players[i].player.pauseVideo();
                
                // Add highlight effect to stopped container
                var container = document.getElementById('container-' + players[i].index);
                if (container) {
                    container.style.boxShadow = '0 0 20px rgba(96, 125, 139, 0.6)';
                    setTimeout(function() {
                        container.style.boxShadow = '';
                    }, 1000);
                }
            } catch (error) {
                console.error("Error stopping video:", error);
            }
        }
    }

    // Remove all players with animation
    function removeAllPlayers() {
        if (players.length === 0) {
            return;
        }
        
        // Stop all videos first
        stopAllVideos();
        
        // Animate removal of players
        var containers = document.querySelectorAll('.player-container');
        var delay = 0;
        
        for (var i = 0; i < containers.length; i++) {
            (function(container, d) {
                setTimeout(function() {
                    container.style.transform = 'translateY(20px)';
                    container.style.opacity = '0';
                    
                    setTimeout(function() {
                        container.remove();
                        
                        // If this is the last container, reset arrays
                        if (i === containers.length - 1) {
                            document.getElementById('playerGrid').innerHTML = '';
                            players = [];
                            pendingPlayers = [];
                        }
                    }, 300);
                }, d);
            })(containers[i], delay);
            
            delay += 100;
        }
    }

    // Function to close the VPN popup
    function closeVpnPopup() {
        document.getElementById('vpnNotification').style.display = 'none';
        
        // Set a cookie to remember user's choice for 24 hours
        setCookie('vpnNotificationShown', 'true', 1);
    }

    // Function to set a cookie
    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    }

    // Function to get a cookie value
    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Show the popup when the page loads, unless the user has already seen it
    window.addEventListener('load', function() {
        if (!getCookie('vpnNotificationShown')) {
            // Show popup with a slight delay for better user experience
            setTimeout(function() {
                document.getElementById('vpnNotification').style.display = 'block';
            }, 1500);
        }
    });

    // Update the theme toggle JavaScript
    document.getElementById('themeToggle').addEventListener('click', function() {
        const isDarkMode = !document.body.classList.contains('dark-mode');
        const toggleIcon = document.getElementById('toggleIcon');
        
        // Toggle dark mode
        document.body.classList.toggle('dark-mode');
        this.classList.toggle('dark');
        
        // Update icon and ARIA label
        toggleIcon.textContent = isDarkMode ? '🌙' : '☀️';
        this.setAttribute('aria-label', 
            isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
        );
        
        // Save preference
        localStorage.setItem('darkMode', isDarkMode);
    });

    // Initialize theme on load
    document.addEventListener('DOMContentLoaded', () => {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        const toggleIcon = document.getElementById('toggleIcon');
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('themeToggle').classList.add('dark');
            toggleIcon.textContent = '🌙';
        } else {
            toggleIcon.textContent = '☀️';
        }
    });

    // Function to add multiple players based on user input
    function addMultiplePlayers() {
        const videoUrl = document.getElementById('videoUrl').value.trim();
        const countInput = document.getElementById('addMultipleCount');
        const count = parseInt(countInput.value);

        // Validate input
        if (!videoUrl) {
            showError("Please enter a YouTube URL");
            return;
        }
        if (isNaN(count) || count < 1 || count > 50) {
            showError("Please enter a valid number between 1 and 50");
            return;
        }

        // Extract video ID
        const videoId = extractVideoId(videoUrl);
        if (!isValidVideoId(videoId)) {
            showError("Please enter a valid YouTube URL");
            return;
        }

        // Clear input fields
        document.getElementById('videoUrl').value = "";
        countInput.value = "";

        // Add the video multiple times
        for (let i = 0; i < count; i++) {
            addPlayer(videoUrl); // Pass the video URL directly to avoid re-extracting the ID
        }
    }

    // Add automatic refresh after 1 hour
    function setupAutoRefresh() {
        // Set timeout for 1 hour (3600000 milliseconds)
        setTimeout(function() {
          // Reload the page
          window.location.reload();
          
          // Optional: You can add a loading overlay to make it look more like a fresh page load
          const loadingOverlay = document.createElement('div');
          loadingOverlay.style.position = 'fixed';
          loadingOverlay.style.top = '0';
          loadingOverlay.style.left = '0';
          loadingOverlay.style.width = '100%';
          loadingOverlay.style.height = '100%';
          loadingOverlay.style.backgroundColor = 'white';
          loadingOverlay.style.zIndex = '9999';
          loadingOverlay.style.display = 'flex';
          loadingOverlay.style.justifyContent = 'center';
          loadingOverlay.style.alignItems = 'center';
          loadingOverlay.innerHTML = '<div class="loading"></div>';
          document.body.appendChild(loadingOverlay);
        }, 3600000); // 1 hour in milliseconds
    }

    // Call the function when the page loads
    window.addEventListener('load', setupAutoRefresh);
