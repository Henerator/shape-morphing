let screenSize;
let particles = [];

let currentShapeIndex = 0;
const shapes = [];

const gui = new dat.GUI();
const settings = {
    duration: 2000,
    brakingDistance: 100,
    maxForce: 5,
    maxSpeed: 20,
    backgroundColor: 30,
};

function updateScreenSize() {
    const bodyRect = document.body.getBoundingClientRect();
    screenSize = {
        width: bodyRect.width,
        height: bodyRect.height,
        center: createVector(bodyRect.width / 2, bodyRect.height / 2),
    };
    resizeCanvas(screenSize.width, screenSize.height)
}

function generateGUISettings() {
    gui.add(settings, 'duration', 1000, 5000).step(1000);
    gui.add(settings, 'brakingDistance', 50, 300).step(50);
    gui.add(settings, 'maxForce', 0.5, 10).step(0.5);
    gui.add(settings, 'maxSpeed', 5, 50).step(5);
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function rotatePoint(pt, angle, center = { x: 0, y: 0 }) {
    return {
        x: cos(angle) * (pt.x - center.x) - sin(angle) * (pt.y - center.y) + center.x,
        y: sin(angle) * (pt.x - center.x) + cos(angle) * (pt.y - center.y) + center.y,
    }
}

function getTrianglePoints() {
    const sideLength = 350;
    const height = sideLength * Math.sqrt(3) / 4;
    const sidePointsCount = 10;
    const step = (sideLength / sidePointsCount) / sideLength;

    const A = { x: -sideLength / 2, y: height };
    const B = { x: sideLength / 2, y: height };
    const C = { x: 0, y: -height };

    function getSegmentPoints(start, end) {
        const points = [];
        for (let i = step; i <= 1; i += step) {
            points.push({
                x: start.x + (end.x - start.x) * i,
                y: start.y + (end.y - start.y) * i,
            })
        }
        return points;
    }

    return [
        ...getSegmentPoints(A, B),
        ...getSegmentPoints(B, C),
        ...getSegmentPoints(C, A),
    ];
}

function getSquarePoints() {
    const angleStep = 0.15;
    const ratioX = 150;
    const ratioY = 150;
    const points = [];
    for (let i = 0; i <= TWO_PI; i += angleStep) {
        points.push({
            x: ratioX * (abs(cos(i)) * cos(i) + abs(sin(i)) * sin(i)),
            y: ratioY * (abs(cos(i)) * cos(i) - abs(sin(i)) * sin(i)),
        });
    }
    return points;
}

function getCirclePoints() {
    const angleStep = PI / 15;
    const ratio = 150;
    const points = [];
    for (let i = 0; i <= TWO_PI; i += angleStep) {
        points.push({
            x: ratio * cos(i),
            y: ratio * sin(i),
        });
    }
    return points;
}

function getHeartPoints() {
    const angleStep = 0.15;
    const ratio = 10;
    const points = [];
    for (let i = 0; i <= TWO_PI; i += angleStep) {
        points.push({
            x: ratio * 16 * Math.pow(sin(i), 3),
            y: -ratio * (13 * cos(i) - 5 * cos(2 * i) - 2 * cos(3 * i) - cos(4 * i)),
        });
    }
    return points;
}

function getCycloidPoints() {
    const angleStep = 0.12;
    const ratio = 200;
    const points = [];
    for (let i = 0; i <= TWO_PI; i += angleStep) {
        points.push({
            x: ratio * Math.pow(sin(i), 3),
            y: ratio * Math.pow(cos(i), 3),
        });
    }
    return points;
}

function generateShapes() {
    shapes.push(getTrianglePoints());
    shapes.push(getSquarePoints());
    shapes.push(getCirclePoints());
    shapes.push(getHeartPoints());
    shapes.push(getCycloidPoints());
}

function pointsToParticles(points) {
    const lengthDifference = points.length - particles.length;
    if (lengthDifference < 0) {
        particles = particles.slice(0, points.length);
    } else if (lengthDifference > 0) {
        const lastParticle = particles.length > 0
            ? particles[particles.length - 1].clone()
            : new Particle(0, 0, 0, 0);
        const newParticles = new Array(lengthDifference).fill().map(() => lastParticle.clone());
        particles = particles.concat(newParticles);
    }

    particles.forEach((particle, index) => {
        const target = points[index];
        particle.target = createVector(target.x, target.y);
    });
}

function showNextShape() {
    pointsToParticles(shapes[currentShapeIndex]);
    delay(settings.duration).then(() => {
        currentShapeIndex++;
        currentShapeIndex = currentShapeIndex % shapes.length;
        showNextShape();
    });
}

function setup() {
    createCanvas();
    updateScreenSize();

    window.addEventListener('resize', updateScreenSize);

    generateGUISettings();
    generateShapes();
    showNextShape();
}

function clearCanvas() {
    noStroke();
    fill(settings.backgroundColor);
    rect(0, 0, screenSize.width, screenSize.height);
}

function getAttraction(particle, attractor) {
    const desiredSpeed = p5.Vector.sub(attractor, particle.position);
    const targetDistance = desiredSpeed.mag();
    const speed = targetDistance < settings.brakingDistance
        ? map(targetDistance, 0, settings.brakingDistance, 0, settings.maxSpeed)
        : settings.maxSpeed;

    desiredSpeed.setMag(speed);

    return p5.Vector
        .sub(desiredSpeed, particle.speed)
        .limit(settings.maxForce);
}

function applyAttraction(particle) {
    const attraction = getAttraction(particle, particle.target);
    particle.applyForce(attraction);
}

function limitSpeed(particle) {
    particle.speed.limit(settings.maxSpeed);
}

function drawParticles() {
    strokeWeight(20);
    stroke(250);
    particles.forEach(particle => particle.draw());
}

function drawPoints(points) {
    strokeWeight(20);
    stroke(250);
    points.forEach(pt => point(pt.x, pt.y));
}

function draw() {
    clearCanvas();

    translate(screenSize.width / 2, screenSize.height / 2);
    drawParticles();

    update();
}

function update() {
    particles.forEach(particle => {
        applyAttraction(particle);
        limitSpeed(particle);

        particle.update();
    });
}
