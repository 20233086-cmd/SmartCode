"""Generate a VietQR/NAPAS credit-transfer QR locally, without an image API."""
import binascii
import io
import re
import qrcode
import qrcode.image.svg

VPBANK_BIN = "970432"


def tlv(tag, value):
    length = len(value.encode("utf-8"))
    if length > 99:
        raise ValueError("QR field too long")
    return f"{tag}{length:02d}{value}"


def vpbank_payload(account, amount, note):
    if not re.fullmatch(r"[0-9]{6,19}", account) or type(amount) is not int or not 1000 <= amount <= 50000000:
        raise ValueError("Invalid transfer details")
    if not re.fullmatch(r"[A-Z0-9]{1,40}", note):
        raise ValueError("Invalid transfer reference")
    beneficiary = tlv("00", VPBANK_BIN) + tlv("01", account)
    merchant = tlv("00", "A000000727") + tlv("01", beneficiary) + tlv("02", "QRIBFTTA")
    payload = (tlv("00", "01") + tlv("01", "12") + tlv("38", merchant) +
               tlv("53", "704") + tlv("54", str(amount)) + tlv("58", "VN") +
               tlv("62", tlv("08", note)) + "6304")
    return payload + f"{binascii.crc_hqx(payload.encode('utf-8'), 0xFFFF):04X}"


def qr_svg(payload):
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=4)
    qr.add_data(payload)
    qr.make(fit=True)
    out = io.BytesIO()
    qr.make_image(image_factory=qrcode.image.svg.SvgPathFillImage).save(out)
    return out.getvalue()
