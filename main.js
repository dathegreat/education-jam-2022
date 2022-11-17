const scale = 50
const canvasSize = 500

const getContext = () =>{
    const canvas = document.getElementById("canvas")
    const ctx = canvas.getContext("2d", 
        {willReadFrequently : true},
        {alpha: false})
    return ctx
}

const transformVector = (a, b) =>{
    //takes a 2x2 transformation matrix and a 2x1 vector
    //returns a 2x1 vector
    let product = []
    a.rows.forEach((v)=>
        product.push( (v.x * b.x) + (v.y * b.y) )
    )
    
    return new Vector([product[0], product[1]], b.rgba)
}

const transformMatrix = (a, b) =>{
    //takes an nx2 transformation matrix and a nx2 matrix
    //returns an nx2 matrix
    let product = []
    const bt = b.getTranspose()
    console.log(a, b, bt)
    for(let i=0; i<a.rows.length; i++){
        let vector = []
        for(let j=0; j<bt.rows.length; j++){
            vector.push( 
                (a.rows[i].x * bt.rows[j].x) + (a.rows[i].y * bt.rows[j].y)
            )
        }
        product.push(new Vector([vector[0], vector[1]], b.rows[0].rgba))
    } 
    
    return new Matrix(product)
}

const multiplyVectors = (a, b) =>{
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
            [a.x + b.x, a.y + b.y], 

            [a.rgba[0] + b.rgba[0] / 2,
             a.rgba[1] + b.rgba[1] / 2,
             a.rgba[2] + b.rgba[2] / 2,
             a.rgba[3] + b.rgba[3] / 2]
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
        vectors.forEach((row)=>{
            this.rows.push(row)
        })
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

const clearCanvas = (color) =>{
    // const canvas = document.getElementById("canvas")
    // const ctx = canvas.getContext("2d")
    ctx.fillStyle = color
    ctx.clearRect(0,0,canvasSize, canvasSize)
}

const drawVector = (vector, start= new Vector([0,0]) ) =>{
    // const canvas = document.getElementById("canvas")
    // const ctx = canvas.getContext("2d")
    const thickness = 10
    const tip = addVectors(vector, start)
    const unitNormal = multiplyVectors(vector.getNormal(), 1/vector.magnitude)
    const scaledNormal = multiplyVectors(unitNormal, thickness)
    const scaledVector = multiplyVectors(vector, 0.9)
    const scaledTip = addVectors(scaledVector, start)
    const arrowTop = addVectors(
        scaledTip, 
        scaledNormal
    )
    const arrowBottom = addVectors(
        scaledTip, 
        multiplyVectors(scaledNormal, -1)
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
    matrix.rows.forEach((value)=>{
        drawVector(value)
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

const animateTransform = (frameMatrix) =>{
    //iterate through tweened frames array and draw them
    const frameRate = 30
    frameMatrix.forEach((matrix)=>{
        setTimeout(()=>{
            clearCanvas("white")
            drawImageFromMatrix(matrix)
        }, 1000/frameRate)
    })

}

const handleMatrixInput = () =>{
    const transformationMatrix = new Matrix([
        new Vector([
            document.getElementById("[0,0]").value,
            document.getElementById("[1,0]").value
        ]),
        new Vector([
            document.getElementById("[0,1]").value,
            document.getElementById("[1,1]").value
        ])
    ])
    return transformationMatrix
}

const drawTransform = () =>{
    //take a transformation matrix from the user and generate
    //a list of interpolated "frames" between the identity matrix
    //and the matrix with the transform applied
    const steps = 1000
    const transformationMatrix = handleMatrixInput()
    const canvasPixels = getCanvasPixels()
    const canvasMatrix = pixelsToMatrix(canvasPixels)
    const transformedMatrix = transformMatrix(canvasMatrix, transformationMatrix)

    let tweenedMatrices = []
    for(let i=0; i<transformedMatrix.rows.length; i++){
        tweenedMatrices.push( 
            tweenVectors(canvasMatrix.rows[i], transformedMatrix.rows[i], steps)
        )
    }
    // console.log(tweenedMatrices)
    animateTransform( tweenedMatrices )
    
}

const drawImageFromFile = (source) =>{
    // const canvas = document.getElementById("canvas")
    // const ctx = canvas.getContext("2d")
    const image = new Image()
    image.src= source
    image.onload = () =>{
        ctx.drawImage(image, 0, 0)
        const pixelMatrix = pixelsToMatrix(getCanvasPixels())
        drawImageFromMatrix(pixelMatrix)
        // const imageMat = pixelsToMatrix(getCanvasPixels())
        // console.log(imageMat)
        // const transformed = transformMatrix(transform1, imageMat)
        // console.log(transformed)
        // drawImageFromMatrix(transformed)
    }
    
}

const getCanvasPixels = () =>{
    // const canvas = document.getElementById("canvas")
    // const ctx = canvas.getContext("2d")
    const imageData = ctx.getImageData(0,0,canvasSize,canvasSize)
    return imageData
}

const pixelsToMatrix = (imageData) =>{
    tempVectorArray = []
    for(let i=0; i<imageData.data.length; i+=4){
        const pixelX = (i / 4) % imageData.width
        const pixelY = Math.floor( (i / 4) / imageData.height )
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
    // const canvas = document.getElementById("canvas")
    // const ctx = canvas.getContext("2d")
    const imageDataObject = ctx.createImageData(canvasSize, canvasSize)
    matrix.rows.map((vector)=>{
        const index = 4 * (vector.x + (canvasSize * vector.y))
        imageDataObject.data[index] = vector.rgba[0]
        imageDataObject.data[index + 1] = vector.rgba[1]
        imageDataObject.data[index + 2] = vector.rgba[2]
        imageDataObject.data[index + 3] = 255
    })
    ctx.putImageData(imageDataObject, 0, 0)
}

document.getElementById("canvas").height = canvasSize
document.getElementById("canvas").size = canvasSize
document.getElementById("matrixSubmit").addEventListener("click", drawTransform)
const ctx = getContext()
const grid = new Matrix([
    new Vector([scale, 0]),
    new Vector([0, scale])
    ])

drawImageFromFile("palm.png")

const transform1 = new Matrix([
    new Vector([0, 1]),
    new Vector([-1, 0])
    ])
