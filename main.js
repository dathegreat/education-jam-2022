const scale = 250
const canvasSize = 500
const origin = Math.floor(canvasSize / 2)

const getContext = () =>{
    const canvas = document.getElementById("canvas")
    const ctx = canvas.getContext("2d", 
        {willReadFrequently : true},
        {alpha: false})
    ctx.translate(origin, origin)
    return ctx
}

const dotVectors = (a, b) =>{
    //takes two 2x1 vectors
    //returns a scalar
    return ( (a.x * b.x) + (a.y * b.y) )
}

const transformVector = (a, b) =>{
    //takes a 2x2 transformation matrix and a 2x1 vector
    //returns  2x2 vector
    //math.floor values to prevent sub-pixel calculations
    return (new Vector(
        [Math.floor(dotVectors(a.rows[0], b)),
         Math.floor(dotVectors(a.rows[1], b))],  
        b.rgba
        )
    )
}

const transformMatrix = (a, b) =>{
    //takes a 2x2 transformation matrix and an nx2 matrix
    //returns an nx2 matrix
    const transformedArray = b.rows.map((vector)=>{
        return transformVector(a, vector)
    })

    return new Matrix( transformedArray)
}

const scaleVectors = (a, b) =>{
    //takes a vector and a scalar
    //returns a 2x1 vector
    return ( new Vector(
        [a.x * b,
        a.y * b],
        a.rgba
    ))
}

const addVectors = (a, b) =>{
    return(
        new Vector(
            [a.x + b.x, a.y + b.y]

            // [a.rgba[0] + b.rgba[0] / 2,
            //  a.rgba[1] + b.rgba[1] / 2,
            //  a.rgba[2] + b.rgba[2] / 2,
            //  a.rgba[3] + b.rgba[3] / 2]
        )
    )
}

class Vector{
    constructor(values, rgba=null){
        this.array = values
        this.x = values[0]
        this.y = values[1]
        this.rgba = rgba
        this.magnitude = Math.sqrt(
            Math.pow(this.x, 2) + Math.pow(this.y, 2)
        )
    }
    getNormal(){
        return(
            transformVector(
                new Matrix([
                    new Vector([0, -1]),
                    new Vector([1, 0])
                ]), 
            new Vector([this.x, this.y], this.rgba)
            )
        )
    }
}

class Matrix{
    constructor(vectors){
        this.rows = []
        for(let i=0; i<vectors.length; i++){
            this.rows.push(vectors[i])
        }
    }

    getTranspose(){
        let tempMatrix = []
        let xArray = []
        let yArray = []
        this.rows.forEach((row)=>{
            xArray.push(row.x)
            yArray.push(row.y)
        })
        tempMatrix.push(
            new Vector(xArray),
            new Vector(yArray)
        )
        return new Matrix(tempMatrix)
    }
}

const clearCanvas = () =>{
    ctx.clearRect(-origin, -origin, canvasSize, canvasSize)
}

const drawVector = (vector, start= new Vector([0,0]) ) =>{
    const thickness = 10
    const tip = addVectors(vector, start)
    const unitNormal = scaleVectors(vector.getNormal(), 1/vector.magnitude)
    const scaledNormal = scaleVectors(unitNormal, thickness)
    const scaledVector = scaleVectors(vector, 0.9)
    const scaledTip = addVectors(scaledVector, start)
    const arrowTop = addVectors(
        scaledTip, 
        scaledNormal
    )
    const arrowBottom = addVectors(
        scaledTip, 
        scaleVectors(scaledNormal, -1)
    )
    //draw vector
    ctx.lineWidth = thickness
    ctx.strokeStyle = "black"
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(scaledTip.x, scaledTip.y)
    ctx.stroke()
    //draw arrow tip
    ctx.beginPath()
    ctx.fillStyle="black"
    ctx.moveTo(tip.x, tip.y)
    ctx.lineTo(arrowTop.x, arrowTop.y)
    ctx.lineTo(arrowBottom.x, arrowBottom.y)
    ctx.closePath()
    ctx.fill()
}

const drawMatrix = (matrix) =>{
    matrix.rows.forEach((vector)=>{
        drawVector(vector)
    })
}

const drawGrid = (identity) =>{
    //to save resources, take a single 2x2 identity matrix
    //and draw it many times to form a grid
    for(let x=0; x<canvasSize; x+=scale){
        for(let y=0; y<canvasSize; y+=scale){
            drawVector( identity.rows[0], new Vector([x, y]) )
            drawVector( identity.rows[1], new Vector([x, y]) )
        }
    }
}

const tweenValues = (a, b, steps) => {
    //returns a list of values between a and b (inclusive)
    let tweenedValues = []
    const stepSize = (b - a) / steps
    for(let i=0; i<=steps; i++){
        tweenedValues.push( a + (stepSize * i) )
    }
    return tweenedValues
}

const tweenVectors = (a, b, steps) =>{
    //returns a matrix of vectors between a and b (inclusive)
    //math.floor improves performance by reducing sub-pixel math on draw
    let tweenedVectors = []
    const stepSizeX = (b.x - a.x) / steps
    const stepSizeY = (b.y - a.y) / steps
    for(let i=0; i<=steps; i++){
        tweenedVectors.push( 
            new Vector([
                Math.floor(a.x + (stepSizeX * i)),
                Math.floor(a.y + (stepSizeY * i)),
                ],
                a.rgba
            )
        )
    }
    return new Matrix( tweenedVectors )
}

const animateTransform = (frameArray) =>{
    //iterate through tweened frames array and draw them
    const frameRate = 24
    for(let i=0; i<frameArray.length; i++){
        setTimeout(()=>{
            clearCanvas()
            drawImageFromMatrix(frameArray[i])
        }, 1000/frameRate)
    }
}

const handleMatrixInput = () =>{
    const transformationMatrix = new Matrix([
        new Vector([
            document.getElementById("[0,0]").value,
            document.getElementById("[0,1]").value
        ]),
        new Vector([
            document.getElementById("[1,0]").value,
            document.getElementById("[1,1]").value
        ])
    ])
    return transformationMatrix
}

const createTransformFrames = () =>{
    //take a transformation matrix from the user and generate
    //a list of interpolated "frames" between the identity matrix
    //and the matrix with the transform applied
    const steps = 100
    const transformationMatrix = handleMatrixInput()
    const canvasPixels = getCanvasPixels()
    const canvasMatrix = pixelsToMatrix(canvasPixels)
    //const transformedMatrix = transformMatrix(transformationMatrix, canvasMatrix)
    const tweened00 = tweenValues(1, transformationMatrix.rows[0].array[0], steps)
    const tweened01 = tweenValues(0, transformationMatrix.rows[0].array[1], steps)
    const tweened10 = tweenValues(0, transformationMatrix.rows[1].array[0], steps)
    const tweened11 = tweenValues(1, transformationMatrix.rows[1].array[1], steps)
    let tweenedFrames = []
    for(let i=0; i<=steps; i++){
        const tweenedTransform = new Matrix([
            new Vector( [tweened00[i], tweened01[i]] ),
            new Vector( [tweened10[i], tweened11[i]] )
        ])
        tweenedFrames.push( 
            transformMatrix(tweenedTransform, canvasMatrix)
        )
    }
    animateTransform( tweenedFrames ) 
}

const drawImageFromFile = (source) =>{
    const image = new Image()
    image.src= source
    image.onload = () =>{
        const scaledWidth = (image.naturalWidth / canvasSize) * scale
        const scaledHeight = (image.naturalHeight / canvasSize) * scale
        ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight)
        drawAxes()
    }
    
}

const getCanvasPixels = () =>{
    //getImageData does not use transformed ctx for coords
    //so (0,0) in this case = (-origin,-origin) on transformed ctx
    const imageData = ctx.getImageData(0,0,canvasSize,canvasSize)
    return imageData
}

const pixelsToMatrix = (imageData) =>{
    //treat each 1D array element as a 2D vector with an associated rgba value
    //ex. first four elements [0,0,0,255...] => vector at (0,0) with rgba value (0,0,0,255)
    tempVectorArray = []
    const imageLength = imageData.data.length
    const lowerBound = origin * -4
    const upperBound = imageLength - (Math.floor(canvasSize / 2) * 4)
    for(let i=lowerBound; i<upperBound; i+=4){
        const pixelX = (( i / 4 ) % canvasSize) - origin
        const pixelY = Math.ceil( ( i / 4 ) / canvasSize ) + (lowerBound / 4)
        tempVectorArray.push(
            new Vector(
                [pixelX, 
                pixelY], 
                [   imageData.data[i],
                    imageData.data[i+1],
                    imageData.data[i+2],
                    imageData.data[i+3]
                ]
            )
        )
    }
    return new Matrix(tempVectorArray)
}

const drawImageFromMatrix = (matrix) =>{
    const imageDataObject = ctx.createImageData(canvasSize, canvasSize)
    //let pixels = []
    matrix.rows.forEach((vector)=>{
        const pixel = 4 * (vector.x + origin + (canvasSize * (vector.y + origin)))
        imageDataObject.data[pixel] = vector.rgba[0]
        imageDataObject.data[pixel + 1] = vector.rgba[1]
        imageDataObject.data[pixel + 2] = vector.rgba[2]
        imageDataObject.data[pixel + 3] = vector.rgba[3]
        //pixels.push([pixel, vector.x, vector.y])
    })
    //console.log(pixels)
    //console.log(imageDataObject)
    ctx.putImageData(imageDataObject, 0, 0)
}

const drawAxes = () =>{
    const length = Math.floor(canvasSize / 2)
    const axesMatrix = new Matrix([
        new Vector([0,length]),
        new Vector([length, 0]),
        new Vector([0, -length]),
        new Vector([-length, 0])
    ])
    
    drawMatrix(axesMatrix)
}

document.getElementById("canvas").height = canvasSize
document.getElementById("canvas").size = canvasSize
document.getElementById("matrixSubmit").addEventListener("click", createTransformFrames)
const ctx = getContext()
const grid = new Matrix([
    new Vector([scale, 0]),
    new Vector([0, scale])
    ])

drawImageFromFile("palm.png")
