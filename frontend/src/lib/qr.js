import { QRCodeCanvas } from '@loskir/styled-qr-code-node';

const options = {
    "type": "canvas",
    "shape": "square",
    "width": 800,
    "height": 800,
    "margin": 3,
    "imageOptions": {
        "saveAsBlob": true,
        "hideBackgroundDots": true,
        "imageSize": 0.4,
        "margin": 5
    },
    "dotsOptions": {
        "type": "rounded",
        "color": "#FFBC1D", //"#7e3cda",
        "roundSize": true
    },
    "backgroundOptions": {
        "round": 0,
        "color": "#ffffff00"
    },
    "dotsOptionsHelper": {
        "colorType": {
            "single": true,
            "gradient": false
        },
        "gradient": {
            "linear": true,
            "radial": false,
            "color1": "#000000", //"#6a1a4c",
            "color2": "#000000", //"#6a1a4c",
            "rotation": "0"
        }
    },
    "cornersSquareOptions": {
        "type": "extra-rounded",
        "color": "#FFBC1D", //"#9d89fc"
    },
    "cornersSquareOptionsHelper": {
        "colorType": {
            "single": true,
            "gradient": false
        },
        "gradient": {
            "linear": true,
            "radial": false,
            "color1": "#000000",
            "color2": "#000000",
            "rotation": "0"
        }
    },
    "cornersDotOptions": {
        "type": "",
        "color": "#FFBC1D",
    },
    "cornersDotOptionsHelper": {
        "colorType": {
            "single": true,
            "gradient": false
        },
        "gradient": {
            "linear": true,
            "radial": false,
            "color1": "#000000",
            "color2": "#000000",
            "rotation": "0"
        }
    },
    "backgroundOptionsHelper": {
        "colorType": {
            "single": true,
            "gradient": false
        },
        "gradient": {
            "linear": true,
            "radial": false,
            "color1": "#ffffff",
            "color2": "#ffffff",
            "rotation": "0"
        }
    }
};

export const createQRCodeWithLogo = async (text, logoPath, outputPath) => {
  try {
    
    const qrCode = new QRCodeCanvas({
        data: text,
        image: logoPath,
        ...options
    });

    await qrCode.toFile(outputPath, 'png');
  } catch (err) {
    console.error(err);
  }
}

export const createQRCode = async (text, outputPath) => {
  try {
    const qrCode = new QRCodeCanvas({
        data: text,
        ...options
    });

    await qrCode.toFile(outputPath, 'png');
  } catch (err) {
    console.error(err);
  }
}
