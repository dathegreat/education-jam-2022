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

const multiply = (a, b) =>{
    //takes a vector and a scalar
    //returns a 2x1 vector
    return ( new Vector(
        a.x * b,
        a.y * b
    ))
}

class Vector{
    constructor(x, y){
        this.x = x
        this.y = y
        this.magnitude = Math.sqrt(
            Math.pow(this.x, 2) + Math.pow(this.y, 2)
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
        console.log(new Matrix(tempMatrix))
        return new Matrix(tempMatrix)
    }
}

const drawVector = (vector, start= new Vector(0,0) ) =>{
    const canvas = document.getElementById("canvas")
    const ctx = canvas.getContext("2d")
    const thickness = 10
    const tip = new Vector(start.x + vector.x, start.y + vector.y)
    const normal = transform(
        new Matrix([
            new Vector(0, -1),
            new Vector(1, 0)
        ]
    ), vector)
    const unitNormal = multiply(normal, 1/vector.magnitude)
        
    ctx.lineWidth = thickness
    ctx.strokeStyle = "black"

    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(tip.x, tip.y)

    ctx.moveTo(tip.x - thickness, tip.y)
    ctx.lineTo(tip.x - thickness, tip.y + thickness)
    ctx.lineTo(tip.x, tip.y)
    ctx.lineTo(tip.x - thickness, tip.y - thickness)
    ctx.lineTo(tip.x - thickness, tip.y)
    ctx.stroke()
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

document.getElementById("canvas").height = canvasSize
document.getElementById("canvas").size = canvasSize
const grid = new Matrix([
    new Vector(scale, 0),
    new Vector(0, scale)
    ])

//drawGrid(grid)
drawVector(new Vector(100,100))
console.log(grid.rows)