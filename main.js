const scale = 50
const width = 500
const height = 500

class Vector{
    constructor(x, y){
        this.x = x
        this.y = y
    }
}

class Point{
    constructor(x, y){
        this.x = x
        this.y = y
    }
}

class Matrix{
    constructor(vectors){
        this.rows = []
        vectors.forEach((row)=>{
            this.rows.push(new Vector(row[0], row[1]))
        })
    }

    transpose(){
        let tempMatrix = []
        this.rows.forEach((value)=>{
            const _x = value.x
            const _y = value.y
            tempMatrix.push( [_y, _x] )
        })
        console.log(new Matrix(tempMatrix))
        return new Matrix(tempMatrix)
    }
}

const generateGrid = (size, resolution) =>{
    let gridMatrix = []
    for(let i=0; i<=resolution; i++){
        for(let j=0; j<=resolution; j++){
            gridMatrix.push(
                [(size/resolution) * i, (size/resolution) * j])
        }
    }
    return gridMatrix
}

const drawVector = (vector, point= new Point(0,0) ) =>{
    const canvas = document.getElementById("canvas")
    const ctx = canvas.getContext("2d")

    ctx.lineWidth = 10
    ctx.strokeStyle = "black"

    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    ctx.lineTo(vector.x, vector.y)
    ctx.stroke()
}

const drawMatrix = (matrix) =>{
    matrix.rows.forEach((value)=>{
        drawVector(value)
    })
}

const drawGrid = (gridMatrix) =>{
    gridMatrix.rows.forEach((value, index)=>{
        drawVector(
            value, 
            gridMatrix.rows[index-1]
        )
    })
}

document.getElementById("canvas").height = height
document.getElementById("canvas").width = width
let grid = new Matrix(generateGrid(height, 10))
//drawMatrix(grid)
drawGrid(grid)
drawGrid(grid.transpose())