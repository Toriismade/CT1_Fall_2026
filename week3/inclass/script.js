        let clrArea = document.getElementById("colorArea")
        console.log(clrArea)
        let clrBtn = document.getElementById("colorButton")
        let txtBtn = document.getElementById("textButton")
        let imgBtn = document.getElementById("imageButton")
        let imgToggle = document.getElementById("imgToggle")

        let changingColor = ()=>{
            let redC = Math.random()*255
            let greenC = Math.random()*255
            let blueC = Math.random()*255
            clrArea.style.background = "rgb(" + redC + ", " + greenC + ", " + blueC + ")"
        }
        let addingText = ()=>{
            let p = document.createElement("p")
            console.log(p)
            p.innerHTML = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
            clrArea.after(p)
        }
        let changingImage = ()=>{
            if(imgToggle.alt == "hand on the ground"){
                imgToggle.src = "images/Uwe Wittwer interior detail 2007.jpg"
                imgToggle.alt = "chandelier"
            }else {
                imgToggle.src = "images/Art.jpg"
                imgToggle.alt = "hand on the ground"
            }
        }


        

        clrBtn.addEventListener("click", changingColor)
        txtBtn.addEventListener("click", addingText)
        imgBtn.addEventListener("click", changingImage)