import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI, orderAPI } from '../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { Loader, ArrowLeft } from 'lucide-react';

const Checkout = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await courseAPI.getCourseById(courseId);
        setCourse(data.course);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      // Create order
      const orderRes = await orderAPI.createOrder({
        courseId,
        paymentMethod: 'stripe',
      });

      const order = orderRes.data.order;

      if (paymentMethod === 'stripe') {
        // Create Stripe session
        const sessionRes = await orderAPI.createStripeSession({
          orderId: order._id,
        });

        // Redirect to Stripe checkout
        const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: sessionRes.data.sessionId,
        });

        if (stripeError) {
          setError(stripeError.message);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-light py-8">
        <div className="max-w-2xl mx-auto px-4">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-primary hover:text-secondary mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Courses
          </button>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">Course not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="flex items-center gap-2 text-primary hover:text-secondary mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Course
        </button>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Course Summary */}
          <div className="border-b border-gray-200 p-5 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-dark">Checkout</h1>

            <div className="flex flex-col sm:flex-row gap-6">
              {course.thumbnail && (
                <img
                  src={course.thumbnail || "/placeholder.svg"}
                  alt={course.title}
                  className="w-32 h-32 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2 text-dark">{course.title}</h2>
                <p className="text-gray-600 mb-4">{course.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold text-primary">${course.price}</span>
                  <span className="px-3 py-1 bg-blue-100 text-primary text-sm font-semibold rounded-full capitalize">
                    {course.level}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="p-5 sm:p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleCheckout}>
              {/* Student Info */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 text-dark">Student Information</h3>
                <div className="bg-light p-4 rounded">
                  <p className="font-semibold text-dark">{auth.user?.name}</p>
                  <p className="text-gray-600">{auth.user?.email}</p>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 text-dark">Payment Method</h3>
                <label className="flex items-center gap-3 p-4 border border-primary rounded cursor-pointer bg-blue-50">
                  <input
                    type="radio"
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="font-semibold text-dark">Stripe (Credit/Debit Card)</span>
                </label>
              </div>

              {/* Order Summary */}
              <div className="mb-8 bg-light p-6 rounded">
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">${course.price}</span>
                </div>
                <div className="flex justify-between mb-4 pb-4 border-b border-gray-300">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-dark">Total</span>
                  <span className="text-2xl font-bold text-primary">${course.price}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
              >
                {processing ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  `Proceed to Payment - $${course.price}`
                )}
              </button>

              {/* Security Note */}
              <p className="text-center text-gray-600 text-sm mt-4">
                🔒 Your payment information is secure and encrypted
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
