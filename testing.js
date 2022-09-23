const fs = require("fs")
const path = "E:/"

var data = "New File Contents"

fs.readFile("res/dog.jpg", (err, data) => {
    console.log("Succesfully loaded")
})

fs.writeFile("year.txt", data, (err) => {
    if(err) console.log(err)
    else    console.log("Successfully Written")
})