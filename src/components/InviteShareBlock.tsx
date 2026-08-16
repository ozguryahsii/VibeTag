import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { baseUrl } from "@/lib/base-url";
import { getShareableInvite } from "@/lib/invite";
import { getDict } from "@/lib/i18n/server";
import { InviteShare } from "@/components/InviteShare";

/**
 * The share card, rendered wherever it belongs. It appears on the invite
 * screen and at the top of "rate someone", because the two halves of the
 * loop — get rated, rate others — belong on the same tap.
 */
export async function InviteShareBlock() {
  const user = await requireUser();
  const [invite, dict] = await Promise.all([
    getShareableInvite(user.id),
    getDict(),
  ]);

  const url = `${await baseUrl()}/i/${invite.code}`;
  const qr = await QRCode.toDataURL(url, {
    width: 512,
    margin: 1,
    color: { dark: "#1F1F1F", light: "#FFF8F5" },
    errorCorrectionLevel: "M",
  });

  return <InviteShare url={url} qr={qr} name={user.name} dict={dict} />;
}
