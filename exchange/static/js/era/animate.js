var drawInterval = 75;
window.requestAnimFrame = (function(callback) { // shim
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
function animate() { // Animation loop that draws the canvas
    context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clear the canvas
    spriteMap.draw(context, 0, 0); // Draw the sprite
    contextGreen.clearRect(0, 0, contextGreen.canvas.width, contextGreen.canvas.height); // Clear the canvas
    spriteMap.draw(contextGreen, 0, 0); // Draw the sprite
    contextRed.clearRect(0, 0, contextRed.canvas.width, contextRed.canvas.height); // Clear the canvas
    spriteMap.draw(contextRed, 0, 0); // Draw the sprite
    requestAnimFrame(animate); // Run the animation loop
}
window.onload = function() {
    // Get the canvas graphics context for the default helicopter
    context = document.getElementById('canvas').getContext('2d');
    //context.shadowColor = '#ff0000';
    context.shadowBlur = 10;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    // Get the canvas graphics context for the green helicopter
    contextGreen = document.getElementById('canvasGreen').getContext('2d');
    contextGreen.shadowColor = '#00ff00';
    contextGreen.shadowBlur = 10;
    contextGreen.shadowOffsetX = 0;
    contextGreen.shadowOffsetY = 0;
    //$(document.body).append($('<canvas id="canvasRed" width="64" height="64" style="display: block; margin: 0 auto; display: none; border: 1px solid black;"></canvas>'));
    contextRed = document.getElementById('canvasRed').getContext('2d');
    contextRed.shadowColor = '#FF0900';
    contextRed.shadowBlur = 10;
    contextRed.shadowOffsetX = 0;
    contextRed.shadowOffsetY = 0;

    // Initialize the SpriteMap
    spriteMap = new SpriteMap(
        '/static/img/chopper-small.png', // sprite image
        { // animation sequences
            TheChopper: {
                // startRow: 0,
                // startCol: 0,
                // endRow: 1,
                // endCol: 3
            }
        }, { // options
            frameW: 30.5, // Width of each frame of the animation in pixels
            frameH: 32, // Height of each frame of the animation in pixels
            projectedW: 32,
            projectedH: 32,
            interval: drawInterval, // Switch frames every 50ms
            useTimer: false, // Rely on requestAnimFrame to update frames instead of setInterval
            postInitCallback: function(sprite) {
                spriteMap.start('TheChopper'); // Start running the animation
                animate(); // Animate the canvas
            } // Do something when the sprite finishes loading
        }
    );
}