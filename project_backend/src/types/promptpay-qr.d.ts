declare module 'promptpay-qr' {
  export default function generatePayload(
    id: string,
    opts?: { amount?: number }
  ): string;
}
