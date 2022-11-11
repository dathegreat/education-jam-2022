const scale = 50
const canvasSize = 500

const transform = (a, b) =>{
    //takes a 2x2 transformation matrix and a 2x1 vector
    //returns a 2x1 vector
    let product = []
    a.rows.forEach((v)=>
        product.push( (v.x * b.x) + (v.y * b.y) )
    )
    
    return new Vector(product[0], product[1])
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
            transform(
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

    transpose(){
        let tempMatrix = []
        this.rows.forEach((row)=>{
            const _x = row.x
            const _y = row.y
            tempMatrix.push( new Vector(_y, _x) )
        })
        return new Matrix(tempMatrix)
    }
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
    for(let x=0; x<canvasSize; x+=scale){
        for(let y=0; y<canvasSize; y+=scale){
            drawVector( identity.rows[0], new Vector(x, y) )
            drawVector( identity.rows[1], new Vector(x, y) )
            console.log(x,y)
        }
    }
}

const handleMatrixInput = () =>{
    const transformationMatrix = new Matrix(
        document.forms['matrixInput']['[0,0]'].value,
        document.forms['matrixInput']['[1,0]'].value,
        document.forms['matrixInput']['[0,1]'].value,
        document.forms['matrixInput']['[1,1]'].value,
    )
    console.log(transformationMatrix)
}

document.getElementById("canvas").height = canvasSize
document.getElementById("canvas").size = canvasSize
document.getElementById("matrixInput").addEventListener("onchange", handleMatrixInput)
const grid = new Matrix([
    new Vector(scale, 0),
    new Vector(0, scale)
    ])

drawGrid(grid)
