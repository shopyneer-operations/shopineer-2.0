"use client"

import { Button } from "@medusajs/ui"
import { OnApproveActions, OnApproveData } from "@paypal/paypal-js"
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { use, useEffect, useState } from "react"
import UnauthorizedMessage from "../error-message"
import Spinner from "@modules/common/icons/spinner"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import {
  isFawaterak,
  isFawry,
  isManual,
  isPaypal,
  isStripe,
} from "@lib/constants"
import {
  ReadonlyURLSearchParams,
  useRouter,
  useSearchParams,
} from "next/navigation"
import { FawryChargeResponse } from "types/fawry"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  // TODO: Add this once gift cards are implemented
  // const paidByGiftcard =
  //   cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  // if (paidByGiftcard) {
  //   return <GiftCardPaymentButton />
  // }

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripe(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    case isPaypal(paymentSession?.provider_id):
      return (
        <PayPalPaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isFawry(paymentSession?.provider_id):
      return (
        <FawryPaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isFawaterak(paymentSession?.provider_id):
      return (
        <FawaterakPaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

// const GiftCardPaymentButton = () => {
//   const [submitting, setSubmitting] = useState(false)

//   const handleOrder = async () => {
//     setSubmitting(true)
//     await placeOrder()
//   }

//   return (
//     <Button
//       onClick={handleOrder}
//       isLoading={submitting}
//       data-testid="submit-order-button"
//     >
//       Place order
//     </Button>
//   )
// }

const FawryPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setUnauthorizedMessage] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  function getChargeResponse() {
    const referenceNumber = searchParams.get("referenceNumber")

    if (referenceNumber) {
      const queryParams: { [key: string]: string } = {}
      searchParams.forEach((value, key) => {
        queryParams[key] = value
      })
      return queryParams as unknown as FawryChargeResponse
    }

    return null
  }

  useEffect(
    function handleChargeResponse() {
      const chargeResponse = getChargeResponse()
      if (!chargeResponse) return

      setSubmitting(true)
      if (chargeResponse.orderStatus == "PAID") {
        onPaymentCompleted()
      }
    },
    [searchParams]
  )

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  console.log("🌩️", "session?.data.checkoutUrl", session?.data.checkoutUrl)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setUnauthorizedMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = async () => {
    setSubmitting(true)

    const fawryCheckoutUrl = session?.data.checkoutUrl as string
    if (fawryCheckoutUrl) router.push(fawryCheckoutUrl)
  }

  return (
    <>
      <Button
        disabled={notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <UnauthorizedMessage
        error={errorMessage}
        data-testid="fawry-payment-error-message"
      />
    </>
  )
}

const FawaterakPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setUnauthorizedMessage] = useState<string | null>(null)

  const router = useRouter()
  // const searchParams = useSearchParams()

  // function getChargeResponse() {
  //   const referenceNumber = searchParams.get("referenceNumber")

  //   if (referenceNumber) {
  //     const queryParams: { [key: string]: string } = {}
  //     searchParams.forEach((value, key) => {
  //       queryParams[key] = value
  //     })
  //     return queryParams as unknown as FawryChargeResponse
  //   }

  //   return null
  // }

  // useEffect(
  //   function handleChargeResponse() {
  //     const chargeResponse = getChargeResponse()
  //     if (!chargeResponse) return

  //     setSubmitting(true)
  //     if (chargeResponse.orderStatus == "PAID") {
  //       onPaymentCompleted()
  //     }
  //   },
  //   [searchParams]
  // )

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  console.log("🌩️", "session?.data.checkoutUrl", session?.data.checkoutUrl)

  // const onPaymentCompleted = async () => {
  //   await placeOrder()
  //     .catch((err) => {
  //       setUnauthorizedMessage(err.message)
  //     })
  //     .finally(() => {
  //       setSubmitting(false)
  //     })
  // }

  const handlePayment = async () => {
    setSubmitting(true)

    const fawryCheckoutUrl = session?.data.checkoutUrl as string
    if (fawryCheckoutUrl) router.push(fawryCheckoutUrl)
  }

  return (
    <>
      <Button
        disabled={notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <UnauthorizedMessage
        error={errorMessage}
        data-testid="fawry-payment-error-message"
      />
    </>
  )
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setUnauthorizedMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setUnauthorizedMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setUnauthorizedMessage(error.message || null)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        return
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <UnauthorizedMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const PayPalPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setUnauthorizedMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setUnauthorizedMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const handlePayment = async (
    _data: OnApproveData,
    actions: OnApproveActions
  ) => {
    actions?.order
      ?.authorize()
      .then((authorization) => {
        if (authorization.status !== "COMPLETED") {
          setUnauthorizedMessage(
            `An error occurred, status: ${authorization.status}`
          )
          return
        }
        onPaymentCompleted()
      })
      .catch(() => {
        setUnauthorizedMessage(`An unknown error occurred, please try again.`)
        setSubmitting(false)
      })
  }

  const [{ isPending, isResolved }] = usePayPalScriptReducer()

  if (isPending) {
    return <Spinner />
  }

  if (isResolved) {
    return (
      <>
        <PayPalButtons
          style={{ layout: "horizontal" }}
          createOrder={async () => session?.data.id as string}
          onApprove={handlePayment}
          disabled={notReady || submitting || isPending}
          data-testid={dataTestId}
        />
        <UnauthorizedMessage
          error={errorMessage}
          data-testid="paypal-payment-error-message"
        />
      </>
    )
  }
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setUnauthorizedMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setUnauthorizedMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid="submit-order-button"
      >
        Place order
      </Button>
      <UnauthorizedMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
