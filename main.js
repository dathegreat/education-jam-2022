/*
    This program seeks to make matrix transformations more intuitive
    by visually and audibly demonstrating how transforms affect the R2 
    vector space. Users can input any 2x2 matrix transform they please, 
    and the program animates a transform from the R2 basis to a vector 
    space defined by the new transformation matrix
    e.g.
    span [1, 0]  becomes  span [0, 1 ]
         [0, 1]                [-1, 0]
    The space is represented by an image, with each pixel defined as a
    vector in R2 with an associated rgba value. 
    Additionally, four oscillators represent the transform matrix's four
    elements. As the transformation animates, the oscillators change in
    pitch to represent their element's value rising or falling. This
    harmony can give a chord-like structure to transformations
*/

class Vector {
	constructor(values, rgba = null) {
		this.x = values[0];
		this.y = values[1];
		this.rgba = rgba;
	}
	getNormal() {
		return transformVector(
			new Matrix([new Vector([0, -1]), new Vector([1, 0])]),
			new Vector([this.x, this.y], this.rgba)
		);
	}
	getMagnitude() {
		return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
	}
}

class Matrix {
	constructor(vectors) {
		this.rows = new Array(vectors.length);
		for (let i = 0; i < vectors.length; i++) {
			this.rows[i] = vectors[i];
		}
	}
}

const getContext = () => {
	const canvas = document.getElementById("canvas");
	const ctx = canvas.getContext(
		"2d",
		{ willReadFrequently: true },
		{ alpha: false }
	);
	ctx.translate(origin, origin);
	return ctx;
};

const dotVectors = (a, b) => {
	//takes two 2x1 vectors
	//returns a scalar
	return a.x * b.x + a.y * b.y;
};

const transformVector = (a, b) => {
	//takes a 2x2 transformation matrix and a 2x1 vector
	//returns  2x2 vector
	//math.floor values to prevent sub-pixel calculations
	return new Vector(
		[
			Math.floor(dotVectors(a.rows[0], b)),
			Math.floor(dotVectors(a.rows[1], b)),
		],
		b.rgba
	);
};

const transformMatrix = async (a, b) => {
	//takes a 2x2 transformation matrix and an nx2 matrix
	//returns an nx2 matrix
	const transformedArray = b.rows.map((vector) => {
		return transformVector(a, vector);
	});

	return new Matrix(transformedArray);
};

const scaleVectors = (a, b) => {
	//takes a vector and a scalar
	//returns a 2x1 vector
	return new Vector([a.x * b, a.y * b], a.rgba);
};

const addVectors = (a, b) => {
	return new Vector([a.x + b.x, a.y + b.y]);
};

const clearCanvas = () => {
	ctx.clearRect(-origin, -origin, canvasSize, canvasSize);
};

const drawVector = (vector, start = new Vector([0, 0]), thickness = 5) => {
	const tip = addVectors(vector, start);
	const unitNormal = scaleVectors(
		vector.getNormal(),
		1 / vector.getMagnitude()
	);
	const scaledNormal = scaleVectors(unitNormal, thickness);
	const scaledVector = scaleVectors(vector, 0.9);
	const scaledTip = addVectors(scaledVector, start);
	const arrowTop = addVectors(scaledTip, scaledNormal);
	const arrowBottom = addVectors(scaledTip, scaleVectors(scaledNormal, -1));
	//draw vector
	ctx.lineWidth = thickness;
	ctx.strokeStyle = "black";
	ctx.beginPath();
	ctx.moveTo(start.x, start.y);
	ctx.lineTo(scaledTip.x, scaledTip.y);
	ctx.stroke();
	//draw arrow tip
	ctx.beginPath();
	ctx.fillStyle = "black";
	ctx.moveTo(tip.x, tip.y);
	ctx.lineTo(arrowTop.x, arrowTop.y);
	ctx.lineTo(arrowBottom.x, arrowBottom.y);
	ctx.closePath();
	ctx.fill();
};

const drawMatrix = (matrix) => {
	matrix.rows.forEach((vector) => {
		drawVector(vector);
	});
};

const drawGrid = (identity) => {
	//to save resources, take a single 2x2 identity matrix
	//and draw it many times to form a grid
	for (let x = -canvasSize; x < canvasSize; x += scale / 10) {
		for (let y = -canvasSize; y < canvasSize; y += scale / 10) {
			drawVector(identity.rows[0], new Vector([x, y]), 2);
			drawVector(identity.rows[1], new Vector([x, y]), 2);
		}
	}
};

const tweenValues = (a, b, steps) => {
	//returns a list of values between a and b (inclusive)
	let tweenedValues = [];
	const stepSize = (b - a) / steps;
	for (let i = 0; i <= steps; i++) {
		tweenedValues.push(a + stepSize * i);
	}
	return tweenedValues;
};

const tweenVectors = (a, b, steps) => {
	//returns a matrix of vectors between a and b (inclusive)
	//math.floor improves performance by reducing sub-pixel math on draw
	let tweenedVectors = [];
	const stepSizeX = (b.x - a.x) / steps;
	const stepSizeY = (b.y - a.y) / steps;
	for (let i = 0; i <= steps; i++) {
		tweenedVectors.push(
			new Vector(
				[
					Math.floor(a.x + stepSizeX * i),
					Math.floor(a.y + stepSizeY * i),
				],
				a.rgba
			)
		);
	}
	return new Matrix(tweenedVectors);
};

const animateTransform = (frameArray) => {
	//iterate through tweened frames array and draw them
	const frameRate = 24;
	createSoundRamp();
	for (let i = 0; i < frameArray.length; i++) {
		setTimeout(() => {
			clearCanvas();
			drawImageFromMatrix(frameArray[i]);
			sound.stepToNextNote();
			if (i >= frameArray.length - 1) {
				sound.globalStop();
			}
		}, 1000 / frameRate);
	}
};

const handleMatrixInput = () => {
	const transformationMatrix = new Matrix([
		new Vector([
			document.getElementById("[0,0]").value,
			document.getElementById("[0,1]").value,
		]),
		new Vector([
			document.getElementById("[1,0]").value,
			document.getElementById("[1,1]").value,
		]),
	]);
	return transformationMatrix;
};

const createTransformFrames = async () => {
	//takes a transformation matrix from the user and generates
	//a list of interpolated "frames" between the identity matrix
	//and the matrix with the transform applied
	const steps = 100;
	const transformationMatrix = handleMatrixInput();
	const canvasPixels = getCanvasPixels();
	const canvasMatrix = pixelsToMatrix(canvasPixels);
	const tweened00 = tweenValues(1, transformationMatrix.rows[0].x, steps);
	const tweened01 = tweenValues(0, transformationMatrix.rows[0].y, steps);
	const tweened10 = tweenValues(0, transformationMatrix.rows[1].x, steps);
	const tweened11 = tweenValues(1, transformationMatrix.rows[1].y, steps);
	sound.tweenedNotes = [tweened00, tweened01, tweened10, tweened11];
	let tweenedFrames = new Array(steps);
	await createProgressBar(steps);
	console.time();
	for (let i = 0; i <= steps; i++) {
		setTimeout(async () => {
			const tweenedTransform = new Matrix([
				new Vector([tweened00[i], tweened01[i]]),
				new Vector([tweened10[i], tweened11[i]]),
			]);
			tweenedFrames[i] = await transformMatrix(
				tweenedTransform,
				canvasMatrix
			);
			await updateProgressBar(i);

			if (i >= steps) {
				console.timeEnd();
				animateTransform(tweenedFrames);
			}
		}, 0);
	}
};

const drawImageFromFile = (source) => {
	const image = new Image();
	image.src = source;
	image.onload = () => {
		const scaledWidth = Math.floor(
			(image.naturalWidth / canvasSize) * scale
		);
		const scaledHeight = Math.floor(
			(image.naturalHeight / canvasSize) * scale
		);
		const center = [
			Math.floor(-scaledWidth / 2),
			Math.floor(-scaledHeight / 2),
		];
		ctx.drawImage(image, center[0], center[1], scaledWidth, scaledHeight);
		drawAxes();
		if (gridEnabled) {
			drawGrid(grid);
		}
	};
};

const getCanvasPixels = () => {
	//getImageData does not use transformed ctx for coords
	//so (0,0) in this case = (-origin,-origin) on transformed ctx
	const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
	return imageData;
};

const pixelsToMatrix = (imageData) => {
	//treat each 1D array element as a 2D vector with an associated rgba value
	//ex. first four elements [0,0,0,255...] => vector at (0,0) with rgba value (0,0,0,255)
	tempVectorArray = [];
	const imageLength = imageData.data.length;
	const lowerBound = origin * -4;
	const upperBound = imageLength - Math.floor(canvasSize / 2) * 4;
	for (let i = lowerBound; i < upperBound; i += 4) {
		const pixelX = ((i / 4) % canvasSize) - origin;
		const pixelY = Math.ceil(i / 4 / canvasSize) + lowerBound / 4;
		tempVectorArray.push(
			new Vector(
				[pixelX, pixelY],
				[
					imageData.data[i],
					imageData.data[i + 1],
					imageData.data[i + 2],
					imageData.data[i + 3],
				]
			)
		);
	}
	return new Matrix(tempVectorArray);
};

const drawImageFromMatrix = (matrix) => {
	const imageDataObject = ctx.createImageData(canvasSize, canvasSize);
	matrix.rows.forEach((vector) => {
		const pixel =
			4 * (vector.x + origin + canvasSize * (vector.y + origin));
		imageDataObject.data[pixel] = vector.rgba[0];
		imageDataObject.data[pixel + 1] = vector.rgba[1];
		imageDataObject.data[pixel + 2] = vector.rgba[2];
		imageDataObject.data[pixel + 3] = vector.rgba[3];
	});
	ctx.putImageData(imageDataObject, 0, 0);
};

const drawAxes = () => {
	const length = Math.floor(canvasSize / 2);
	const axesMatrix = new Matrix([
		new Vector([0, length]),
		new Vector([length, 0]),
		new Vector([0, -length]),
		new Vector([-length, 0]),
	]);

	drawMatrix(axesMatrix);
};

const createProgressBar = async (maxValue) => {
	const bar = document.createElement("div");
	bar.id = "barContainer";
	bar.innerHTML = `
    <label for="bar">Calculating:</label>
    <progress id="bar" value="0" max="${maxValue}"></progress>
    `;
	document
		.getElementById("matrixSubmit")
		.insertAdjacentElement("afterend", bar);
};

const updateProgressBar = async (value) => {
	const bar = document.getElementById("bar");
	bar.value = value;
	if (bar.max != null && value >= bar.max) {
		document.getElementById("barContainer").remove();
	}
};

class Sound {
	constructor(
		oscillatorNumber = 4,
		types = ["square", "square", "square", "square"],
		pitches = [523.25, 329.63, 98.0, 32.7]
	) {
		this.decayTime = 1; //second
		this.noteLength = 0.05; //second
		this.maxVolume = 0.5;

		this.oscillators = new Array(oscillatorNumber);
		this.context = new AudioContext();
		this.gain = this.context.createGain();
		this.filter = this.context.createBiquadFilter();
		this.filter.type = "lowpass";
		this.filter.frequency.value = 700;
		this.panLeft = this.context.createStereoPanner();
		this.panLeft.pan.value = -1;
		this.panRight = this.context.createStereoPanner();
		this.panRight.pan.value = 1;

		this.panLeft.connect(this.gain);
		this.panRight.connect(this.gain);
		this.gain.connect(this.filter);
		this.filter.connect(this.context.destination);
		this.gain.gain.value = this.maxVolume;

		this.oscVolumes = new Array(oscillatorNumber);

		this.fundamentals = pitches;

		this.tweenedNotes = [];
		this.currentNoteStep = 0;

		for (let i = 0; i < oscillatorNumber; i++) {
			this.oscillators[i] = this.context.createOscillator();
			this.oscillators[i].type = types[i];
			this.oscillators[i].frequency.value = pitches[i];
			this.oscVolumes[i] = this.context.createGain();
			this.oscVolumes[i].gain.value = this.maxVolume;
			this.oscillators[i].connect(this.oscVolumes[i]);
			if (i % 2 == 0) {
				this.oscVolumes[i].connect(this.panLeft);
			} else {
				this.oscVolumes[i].connect(this.panRight);
			}
		}
	}

	globalStart() {
		this.oscillators.forEach((oscillator) => {
			oscillator.start();
		});
	}

	globalStop() {
		this.gain.gain.exponentialRampToValueAtTime(
			0.0001,
			this.context.currentTime + this.decayTime
		);
		this.currentNoteStep = 0;
	}

	noteStop(gainNode) {
		gainNode.gain.exponentialRampToValueAtTime(
			0.0001,
			this.context.currentTime + this.noteLength
		);
	}

	noteStart(gainNode) {
		gainNode.gain.exponentialRampToValueAtTime(
			this.maxVolume,
			this.context.currentTime + this.noteLength
		);
	}

	stepToNextNote() {
		for (let i = 0; i < this.oscillators.length; i++) {
			const multiplier = Math.ceil(
				this.tweenedNotes[i][this.currentNoteStep] * 12
			);
			const newNote = this.calculateNextNote(
				this.fundamentals[i],
				multiplier
			);
			if (newNote != this.fundamentals[i]) {
			}
			this.oscillators[i].frequency.value = newNote;
		}
		this.currentNoteStep++;
	}

	calculateNextNote(note, multiplier) {
		return note * Math.pow(2, multiplier / 12);
	}
}

const createSoundRamp = async () => {
	if (sound.context.state != "running") {
		sound.globalStart();
	} else {
		sound.gain.gain.exponentialRampToValueAtTime(
			sound.maxVolume,
			sound.context.currentTime + sound.decayTime
		);
	}
};

const handleClick = async () => {
	await createTransformFrames();
};

const handleImageInput = (e) => {
	const reader = new FileReader();
	reader.onload = () => {
		drawImageFromFile(reader.result);
		userImage = reader.result;
	};
	reader.readAsDataURL(e.target.files[0]);
};

const scale = 500;
const canvasSize = 500;
const origin = Math.floor(canvasSize / 2);
const sound = new Sound();

document.getElementById("canvas").height = canvasSize;
document.getElementById("canvas").size = canvasSize;
document.getElementById("matrixSubmit").addEventListener("click", handleClick);
document.getElementById("grid").addEventListener("change", () => {
	gridEnabled = document.getElementById("grid").checked;
	drawImageFromFile(userImage);
});
document.getElementById("sound").addEventListener("change", () => {
	const soundEnabled = document.getElementById("sound").checked;
	sound.maxVolume = soundEnabled ? 0.5 : 0.0001;
});

document
	.getElementById("imageInput")
	.addEventListener("change", handleImageInput);
const ctx = getContext();
const grid = new Matrix([
	new Vector([scale / 10, 0]),
	new Vector([0, scale / 10]),
]);
let gridEnabled = false;
let userImage = "palm.png";
drawImageFromFile(userImage);
