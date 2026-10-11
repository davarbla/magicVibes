import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripeConfig.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { Check, Sparkles } from 'lucide-react';
import { addMonths } from 'date-fns';

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { currentUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // In a real implementation, you would:
      // 1. Create a payment intent on your backend
      // 2. Confirm the payment with Stripe
      // 3. Create subscription record after successful payment
      
      // For demo purposes, we'll simulate a successful payment
      const cardElement = elements.getElement(CardElement);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create subscription record
      const startDate = new Date().toISOString().split('T')[0];
      const renewalDate = addMonths(new Date(), 1).toISOString().split('T')[0];

      await pb.collection('subscriptions').create({
        user_id: currentUser.id,
        status: 'active',
        start_date: startDate,
        renewal_date: renewalDate,
        stripe_subscription_id: 'sub_demo_' + Date.now()
      }, { $autoCancel: false });

      // Update user subscription status
      await pb.collection('users').update(currentUser.id, {
        subscription_status: 'active',
        subscription_date: startDate,
        renewal_date: renewalDate
      }, { $autoCancel: false });

      await refreshUser();

      toast.success('Subscription activated successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: 'hsl(280 8% 20%)',
        '::placeholder': {
          color: 'hsl(280 8% 45%)',
        },
      },
    },
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Card details</label>
          <div className="p-4 border border-input rounded-lg bg-background">
            <CardElement options={cardElementOptions} />
          </div>
          <p className="text-xs text-muted-foreground">
            Demo mode: Use card number 4242 4242 4242 4242 with any future date and CVC
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="w-full magical-gradient text-foreground hover:opacity-90 transition-all duration-200 active:scale-[0.98]"
        >
          {loading ? 'Processing...' : 'Subscribe for $9.99/month'}
        </Button>
      </CardFooter>
    </form>
  );
};

const SubscriptionPage = () => {
  const features = [
    'Personalized stories featuring your child',
    'Twice weekly delivery (Tuesday & Friday)',
    'Age-appropriate content',
    'Email delivery to your inbox',
    'Cancel anytime'
  ];

  return (
    <>
      <Helmet>
        <title>{`Subscribe - Magicvibes`}</title>
        <meta name="description" content="Subscribe to Magicvibes and start receiving personalized magical stories for your children twice per week." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl magical-gradient mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="mb-2">Subscribe to Magicvibes</h1>
                <p className="text-muted-foreground">Start your magical storytelling journey</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Plan Details */}
                <Card className="rounded-2xl magical-shadow">
                  <CardHeader>
                    <CardTitle>What's included</CardTitle>
                    <CardDescription>Everything you need for magical storytelling</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">$9.99</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Billed monthly, cancel anytime
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Form */}
                <Card className="rounded-2xl magical-shadow">
                  <CardHeader>
                    <CardTitle>Payment details</CardTitle>
                    <CardDescription>Enter your card information to subscribe</CardDescription>
                  </CardHeader>
                  <Elements stripe={stripePromise}>
                    <CheckoutForm />
                  </Elements>
                </Card>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default SubscriptionPage;