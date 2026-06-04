import { Payment } from "@/components/ui/payments/columns";

export const parsePayments = (payments: any) => {
  const parsedPayments: Payment[] = [];
  payments.forEach((payment: any) => {
    let purpose: string = "";
    if (payment.pkgId) {
      purpose = payment.pkgId.name;
    } else if (payment.scid) {
      purpose = payment.scid.cid.title;
    }
    console.log(payment);
    const parsedPayment: Payment = {
      memberName: payment.uid ? payment.uid.name : payment.nonMemberName,
      phone: payment.uid ? payment.uid.phoneNumber : payment.nonMemberPhone,
      purpose,
      paymentTime: payment.paymentTime,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      location: payment.scid
        ? payment.scid.cid.locations[0].branchName
        : " -- ",
      classTime: payment.scid ? payment.scid.startTime : null,
      isRefunded: payment.isRefunded || false,
      refundReason: payment.refundReason || "",
    };
    parsedPayments.push(parsedPayment);
  });
  return parsedPayments;
};
