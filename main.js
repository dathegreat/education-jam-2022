const scale = 50
const canvasSize = 500

const transformVector = (a, b) =>{
    //takes a 2x2 transformation matrix and a 2x1 vector
    //returns a 2x1 vector
    let product = []
    a.rows.forEach((v)=>
        product.push( (v.x * b.x) + (v.y * b.y) )
    )
    
    return new Vector(product[0], product[1])
}

const transformMatrix = (a, b) =>{
    //takes an nx2 transformation matrix and a nx2 matrix
    //returns an nx2 matrix
    let product = []
    a.rows.forEach((v1)=>{
        let vector = []
        b.getTranspose().rows.forEach((v2)=>{
            vector.push( 
                (v1.x * v2.x) + (v1.y * v2.y)
            )
        })
        product.push(new Vector(vector[0], vector[1]))
    })    
    
    return new Matrix(product)
}

const multiplyVectors = (a, b) =>{
    //takes a vector and a scalar
    //returns a 2x1 vector
    return ( new Vector(
        a.x * b,
        a.y * b
    ))
}

const addVectors = (a, b) =>{
    return(
        new Vector(a.x + b.x, a.y + b.y)
    )
}

class Vector{
    constructor(x, y){
        this.x = x
        this.y = y
        this.magnitude = Math.sqrt(
            Math.pow(this.x, 2) + Math.pow(this.y, 2)
        )
    }
    getNormal(){
        return(
            transformVector(
                new Matrix([
                    new Vector(0, -1),
                    new Vector(1, 0)
                ]), 
            new Vector(this.x, this.y)
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
        for(let i=0; i<xArray.length-1; i++){
            tempMatrix.push(
                new Vector(xArray[i], xArray[i+1]),
                new Vector(yArray[i], yArray[i+1])
            )
        }
        return new Matrix(tempMatrix)
    }
}

const fillCanvas = (color) =>{
    const canvas = document.getElementById("canvas")
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = color
    ctx.fillRect(0,0,canvasSize, canvasSize)
}

const drawVector = (vector, start= new Vector(0,0) ) =>{
    const canvas = document.getElementById("canvas")
    const ctx = canvas.getContext("2d")
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
    //console.log(identity)
    for(let x=0; x<canvasSize; x+=scale){
        for(let y=0; y<canvasSize; y+=scale){
            //console.log(identity.rows[0])
            //console.log(identity.rows[1])
            drawVector( identity.rows[0], new Vector(x, y) )
            drawVector( identity.rows[1], new Vector(x, y) )
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

const animateTransform = (frameMatrix) =>{
    const frameRate = 30
    frameMatrix.forEach((matrix)=>{
        setTimeout(()=>{
            fillCanvas("white")
            //console.log("drawing", matrix)
            drawGrid(matrix)
        }, 1000/frameRate)
    })

}

const handleMatrixInput = () =>{
    const transformationMatrix = new Matrix([
        new Vector(
            document.getElementById("[0,0]").value,
            document.getElementById("[1,0]").value
        ),
        new Vector(
            document.getElementById("[0,1]").value,
            document.getElementById("[1,1]").value
        )
        ])
    return transformationMatrix
}

const drawTransform = () =>{
    const steps = 1000
    const transformationMatrix = handleMatrixInput()
    const transformedMatrix = transformMatrix(grid, transformationMatrix)
    const tweened00 = tweenValues(grid.rows[0].x, transformedMatrix.rows[0].x, steps)
    const tweened01 = tweenValues(grid.rows[0].y, transformedMatrix.rows[0].y, steps)
    const tweened10 = tweenValues(grid.rows[1].x, transformedMatrix.rows[1].x, steps)
    const tweened11 = tweenValues(grid.rows[1].y, transformedMatrix.rows[1].y, steps)
    let tweenedMatrices = []
    for(let i=0; i<tweened00.length; i++){
        tweenedMatrices.push(
            new Matrix([
                new Vector(tweened00[i], tweened01[i]),
                new Vector(tweened10[i], tweened11[i])
            ])
        )
    }
    
    
    //console.log("drew", tweenedMatrices, "transformation", transformationMatrix, "transformed", transformedMatrix)
    animateTransform(tweenedMatrices)
    
}

document.getElementById("canvas").height = canvasSize
document.getElementById("canvas").size = canvasSize
document.getElementById("matrixSubmit").addEventListener("click", drawTransform)
const grid = new Matrix([
    new Vector(scale, 0),
    new Vector(0, scale)
    ])

drawGrid(grid)