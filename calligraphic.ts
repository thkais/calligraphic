// 0.0.9
enum LcdFonts
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

enum LcdPixel {
    //% block="1x1"
    Pix11,
    //% block="2x2"
    Pix22,
    //% block="3x3"
    Pix33,
    //% block="4x4"
    Pix44,
    //% block="2x1"
    Pix21,
    //% block="1x2"
    Pix12,
    //% block="4x1"
    Pix41,
    //% block="1x4"
    Pix14
}


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
    //% weight=200
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
        serialTransfer("Tx0y0:");
        let lcdText = "Bx0y0w320h240c";
        lcdText = lcdText + backColor;        // fill with current background-color
        serialTransfer(lcdText);
    }

    //% block="Gib $text an Position X$xCoord , Y$yCoord aus"
    //% inlineInputMode=inline
    //% advanced=true
    //% weight=410
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

    //% block="Gib Zahl $zahl an Position X$xCoord , Y$yCoord aus"
    //% inlineInputMode=inline
    //% advanced=true
    //% weight=400
    export function printAtNum(xCoord: number, yCoord: number, zahl: number) {
        init();
        let lcdText = "Tx";
        lcdText = lcdText + Math.trunc(xCoord);
        lcdText = lcdText + "y" + Math.trunc(yCoord);
        lcdText = lcdText + "c" + frontColor;
        lcdText = lcdText + "f" + fontSize;
        lcdText = lcdText + ":" + zahl;
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
        if (lf == true){
            lcdText = lcdText + "\r";
        }
        serialTransfer(lcdText);
    }

    //% block="Gib Zahl $zahl aus. Zeilenende $lf"
    //% lf.shadow="toggleOnOff"
    export function printNum(zahl: number, lf: boolean){
        init();
        let lcdText = "Tc";
        lcdText = lcdText + frontColor;
        lcdText = lcdText + "f" + fontSize;
        lcdText = lcdText + ":" + zahl;
        if (lf == true){
            lcdText = lcdText + "\r";
        }
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

    function calcFont (font: LcdFonts): number{
        let result: number;
        switch(font){
            case LcdFonts.small:
            result = 0;
            break;
            case LcdFonts.normal:
            result = 1;
            break;
            case LcdFonts.big:
            result = 2;
            break;
            case LcdFonts.veryBig:
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
    export function pixel(size: LcdPixel){
        switch(size){
            case LcdPixel.Pix11:
            pixelSize = 0;
            break;
            case LcdPixel.Pix12:
            pixelSize = 12;
            break;
            case LcdPixel.Pix14:
            pixelSize = 14;
            break;
            case LcdPixel.Pix21:
            pixelSize = 21;
            break;
            case LcdPixel.Pix22:
            pixelSize = 22;
            break;
            case LcdPixel.Pix33:
            pixelSize = 33;
            break;
            case LcdPixel.Pix41:
            pixelSize = 41;
            break;
            case LcdPixel.Pix44:
            pixelSize = 44;
            break;
        }
    }

    //% block="Farbe $color"
    //% color.shadow="colorNumberPicker"
    export function colorSelect(color : number) : number {
        return color;
    }

    //% block="Zeichengröße $size"
    export function font(size : LcdFonts){
        fontSize = calcFont(size);
    }

    //% block="Farbe rot $red grün $green blau $blue"
    //% red.min=0 red.max=255
    //% green.min=0 green.max=255
    //% blue.min=0 blue.max=255
    //% advanced=true
    //% weight=500
    // Returns a 24-Bit color-code
    export function calculateColor(red: number, green: number, blue: number): number {
        let color = ((red & 0xff)<<16)|((green & 0xFF)<<8)|(blue & 0xFF);
        return color;
    }

    //% block="Punkt an X$xCoord Y$yCoord"
    //% inlineInputMode=inline
    export function plot(xCoord: number, yCoord: number){
        init();
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
        init();
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
        init();
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
        init();
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
    //% weight=310
    export function circle(xCoord: number, yCoord: number, radius: number){
        init();
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
    //% weight=300
    export function fullCircle(xCoord: number, yCoord: number, radius: number){
        init();
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
    //% weight=110
    export function button(id: number, xCoord: number, yCoord: number, width: number, height: number) {
        init();
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
    //% weight=100
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
    //% weight=110
    export function shiftAreaUp(xCoord: number, yCoord: number, width: number, height: number, pixel: number){
        let lcdText = "Vx"
        lcdText = lcdText + Math.trunc(xCoord);
        lcdText = lcdText + "y" + Math.trunc(yCoord);
        lcdText = lcdText + "w" + Math.trunc(width);
        lcdText = lcdText + "h" + Math.trunc(height);
        lcdText = lcdText + "f" + pixel;
        serialTransfer(lcdText);
    }

}
