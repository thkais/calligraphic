
enum lcdFonts
{
    //% block="normal"
    normal,
    //% block="klein"
    small,
    //% block="groß"
    big,
    //% block="sehr groß"
    veryBig
};


//% weight=44 color=#198CD0 icon="\uf108" block="Calli:Graphic"
namespace lcd {
    let frontColor = 65535;
    let backColor = 0;
    let touchSwitch = 0;
    let fontSize = 1;
    let pixelSize = 0;
    let initFlag = 0;
    let okFlag = 0;
    let startCode = String.fromCharCode(2);
    let endCode = String.fromCharCode(4);
    let chkCode = String.fromCharCode(6);

   serial.onDataReceived(endCode, function () {
        let serialText = serial.readUntil(endCode)
        if (serialText.charAt(0) == startCode) {
            if (serialText.charAt(1) == "S") {
                touchSwitch = serialText.charCodeAt(2)-48;
                okFlag = 1;
            }
            if (serialText.charAt(1) == "s"){
                touchSwitch = 0;
                okFlag = 1;
            }
            if (serialText.charAt(1)=="K"){
                okFlag = 1;
            }
            if (serialText.charAt(1)=="E"){
                okFlag = 2;
            }
        }
    })

    function serialTransfer(text: string){
        let timeout = 0;
        let chksum = 0;
        let len = text.length;

        okFlag = 0;
        
        for (let i = 0; i < len; i++){
            chksum = chksum + text.charCodeAt(i);
        }

        serial.writeString(startCode + text + chkCode + chksum + endCode);
        while (okFlag == 0){
            basic.pause(1);
            timeout ++;
            if (timeout > 150){
                //basic.setLedColor(0x808000);
                //basic.pause(1000);
                break;
            }
        }
        if (okFlag == 2){
        //    basic.pause(1000);
        }
        //basic.setLedColor(0x008000);
    }
    
    //% block="Touch-Feld"
    //% advanced=true
    export function touch(): number {
        serialTransfer("R");
        return touchSwitch;
    }

    function init() {
        if (initFlag == 0){
        serial.redirect(
            SerialPin.C17,
            SerialPin.C16,
            BaudRate.BaudRate115200
        )
        //serial.setRxBufferSize(32);
        initFlag = 1;
        frontColor = 65535;
        backColor = 0;
        touchSwitch = 0;
        fontSize = 1;
        pixelSize = 0;
        basic.pause(250);
        }
    }

    //% block="Lösche LCD"
    export function clear() {
        init();
        serialTransfer("Tx0x0");
        let lcdText = "Bx0y0w320h240c";
        lcdText = lcdText + backColor;        // fill with current background-color
        serialTransfer(lcdText);
    }

    //% block="Gib $text an Position $xCoord , $yCoord aus"
    //% inlineInputMode=inline
    //% advanced=true
    export function printAt(xCoord: number, yCoord: number, text: string) {
        init();
        let lcdText = "Tx";
        lcdText = lcdText + Math.trunc(xCoord);
        lcdText = lcdText + "y" + Math.trunc(yCoord);
        lcdText = lcdText + "c" + frontColor;
        lcdText = lcdText + "f" + fontSize;
        lcdText = lcdText + ":" + text;
        serialTransfer(lcdText);
       
    }

    //% block="Gib $text aus. Zeilenende $lf"
    //% lf.shadow="toggleOnOff"
    export function print(text: string, lf: boolean){
        init();
        let lcdText = "Tc";
        lcdText = lcdText + frontColor;
        lcdText = lcdText + "f" + fontSize;
        lcdText = lcdText + ":" + text;
        if (lf == true)
            lcdText = lcdText + "\r";
        lcdText = lcdText;
        serialTransfer(lcdText);
    }

    // the LCD uses a 16-Bit Value for Colors
    // red: 5, green: 6, blue: 5 bits
    function calcColor (color: number): number{
        let red = (color  & 0xF80000) >> 8;
        let green = (color & 0x00FC00) >> 5;
        let blue = (color & 0x0000F8) >> 3;
        color = red | green | blue;
        return color;
    }

    function calcFont (font: lcdFonts): number{
        let result: number;
        switch(font){
            case lcdFonts.small:
            result = 0;
            break;
            case lcdFonts.normal:
            result = 1;
            break;
            case lcdFonts.big:
            result = 2;
            break;
            case lcdFonts.veryBig:
            result = 3;
            break;
        }
        return result;
    }

    //% block="Farbe Hintergrund: $bColor"
    export function backgroundColor(bColor: number) {
		init();
        backColor = calcColor(bColor);
        serialTransfer("Gc" + backColor);
    }

    //% block="Farbe Vordergrund: $fColor"
    export function drawingColor(fColor: number) {
        frontColor = calcColor(fColor);
    }

    //% block="Pixelgröße $size"
    export function pixel(size: number){
        pixelSize = Math.trunc(size);
    }

    //% block="Farbe $color"
    //% color.shadow="colorNumberPicker"
    export function colorSelect(color : number) : number {
        return color;
    }

    //% block="Zeichengröße $size"
    export function font(size : lcdFonts){
        fontSize = calcFont(size);
    }

    //% block="Farbe rot $red grün $green blau $blue"
    //% red.min=0 red.max=255
    //% green.min=0 green.max=255
    //% blue.min=0 blue.max=255
    //% advanced=true
    // Returns a 24-Bit color-code
    export function calculateColor(red: number, green: number, blue: number): number {
        let color = ((red & 0xff)<<16)|((green & 0xFF)<<8)|(blue & 0xFF);
        return color;
    }

    //% block="Punkt an X$xCoord Y$yCoord"
    //% inlineInputMode=inline
    export function plot(xCoord: number, yCoord: number){
        let lcdText = "Px";
        lcdText = lcdText + Math.trunc(xCoord);
        lcdText = lcdText + "y" + Math.trunc(yCoord);
        lcdText = lcdText + "c" + frontColor;
        lcdText = lcdText + "f" + pixelSize;
        serialTransfer(lcdText);
    }

    //% block="Linie von X$xStart Y$yStart nach X$xEnd Y$yEnd"
    //% inlineInputMode=inline
    export function line(xStart: number, yStart: number, xEnd: number, yEnd: number){
        let lcdText = "Lx";
        lcdText = lcdText + Math.trunc(xStart);
        lcdText = lcdText + "y" + Math.trunc(yStart);
        lcdText = lcdText + "w" + Math.trunc(xEnd);
        lcdText = lcdText + "h" + Math.trunc(yEnd);
        lcdText = lcdText + "c" + frontColor;
        lcdText = lcdText + "f" + pixelSize;
        serialTransfer(lcdText);
    }

    //% block="Line zu X$xCoord Y$yCoord"
    export function draw(xCoord: number, yCoord: number){
        let lcdText = "Dx";
        lcdText = lcdText + Math.trunc(xCoord);
        lcdText = lcdText + "y" + Math.trunc(yCoord);
        lcdText = lcdText + "c" + frontColor;
        lcdText = lcdText + "f" + pixelSize;
        serialTransfer(lcdText);        
    }

    //% block="Rechteck an X$xCoord Y$yCoord Größe $width x $height"
    //% inlineInputMode=inline
    export function box(xCoord: number, yCoord: number, width: number, height: number) {
        let lcdText = "Bx";
        lcdText = lcdText + Math.trunc(xCoord);
        lcdText = lcdText + "y" + Math.trunc(yCoord);
        lcdText = lcdText + "w" + Math.trunc(width);
        lcdText = lcdText + "h" + Math.trunc(height);
        lcdText = lcdText + "c" + frontColor;
        serialTransfer(lcdText);
    }

    //% block="Zeichne Kreis an X$xCoord Y$yCoord Radius$radius"
    //% advanced = true
    export function circle(xCoord: number, yCoord: number, radius: number){
        let lcdText = "Cx";
        lcdText = lcdText + Math.trunc(xCoord);
        lcdText = lcdText + "y" + Math.trunc(yCoord);
        lcdText = lcdText + "h" + Math.trunc(radius);
        lcdText = lcdText + "c" + frontColor;
        lcdText = lcdText + "f" + pixelSize;
        serialTransfer(lcdText);
    }

    //% block="Zeichne gefüllten Kreis an X$xCoord Y$yCoord Radius$radius"
    //% advanced = true
    export function fullCircle(xCoord: number, yCoord: number, radius: number){
        let lcdText = "Fx";
        lcdText = lcdText + Math.trunc(xCoord);
        lcdText = lcdText + "y" + Math.trunc(yCoord);
        lcdText = lcdText + "h" + Math.trunc(radius);
        lcdText = lcdText + "c" + frontColor;
        lcdText = lcdText + "f" + pixelSize;
        serialTransfer(lcdText);
    }

    //% block="Touch-Feld Nr. $id an X$xCoord Y$yCoord Größe $width x $height"
    //% inlineInputMode=inline
    //% advanced=true
    export function button(id: number, xCoord: number, yCoord: number, width: number, height: number) {
        let lcdText = "Sn"
        box(xCoord, yCoord, width, height);
        lcdText = lcdText + id;
        lcdText = lcdText + "x" + Math.trunc(xCoord);
        lcdText = lcdText + "y" + Math.trunc(yCoord);
        lcdText = lcdText + "w" + Math.trunc(width);
        lcdText = lcdText + "h" + Math.trunc(height);
        serialTransfer(lcdText);
    }

    //% block="Schiebe Bereich X$xCoord Y$yCoord $width x $height um $pixel Pixel nach links"
    //% inlineInputMode=inline
    //% advanced=true
    export function shiftArea(xCoord: number, yCoord: number, width: number, height: number, pixel: number){
        let lcdText = "Hx"
        lcdText = lcdText + Math.trunc(xCoord);
        lcdText = lcdText + "y" + Math.trunc(yCoord);
        lcdText = lcdText + "w" + Math.trunc(width);
        lcdText = lcdText + "h" + Math.trunc(height);
        lcdText = lcdText + "f" + pixel;
        serialTransfer(lcdText);
    }

    //% block="Schiebe Bereich X$xCoord Y$yCoord $width x $height um $pixel Pixel nach oben"
    //% inlineInputMode=inline
    //% advanced=true
    export function shiftAreaUp(xCoord: number, yCoord: number, width: number, height: number, pixel: number){
        let lcdText = "Vx"
        lcdText = lcdText + Math.trunc(xCoord);
        lcdText = lcdText + "y" + Math.trunc(yCoord);
        lcdText = lcdText + "w" + Math.trunc(width);
        lcdText = lcdText + "h" + Math.trunc(height);
        lcdText = lcdText + "f" + pixel;
        serialTransfer(lcdText);
    }

    //% block
    export function getVersion (){
        serialTransfer("Z");
    }
}
