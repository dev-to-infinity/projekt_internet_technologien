const picture_A = document.getElementById("picture_A")
const picture_B = document.getElementById("picture_B")
const picture_C = document.getElementById("picture_C")
picture_A.onclick = () => {document.getElementById("home_about_right").innerHTML = '<img src="../img/Airport.jpg" alt="Airport" id="sec_image"></img>'}
picture_B.onclick = () => {document.getElementById("home_about_right").innerHTML = '<img src="../img/Night.jpg" alt="Nightview"></img>'}
picture_C.onclick = () => {document.getElementById("home_about_right").innerHTML = '<img src="../img/Inside.jpg" alt="Interior"></img>'}