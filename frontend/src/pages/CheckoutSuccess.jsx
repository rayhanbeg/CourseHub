import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { CheckCircle, Loader, ArrowRight } from 'lucide-react';

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        await orderAPI.confirmOrderPayment(orderId);
        const { data } = await orderAPI.getOrderById(orderId);
        setOrder(data.order);
      } catch (error) {
        console.error('Failed to fetch order', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-light py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-6">
              <CheckCircle className="w-16 h-16 text-accent" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold text-dark mb-2">Payment Successful!</h1>
          <p className="text-gray-600 text-lg mb-8">
            Thank you for your purchase. You now have access to the course.
          </p>

          {/* Order Details */}
          {order && (
            <div className="bg-light rounded-lg p-6 mb-8 text-left">
              <h2 className="font-bold text-lg mb-4 text-dark">Order Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-semibold text-dark">{order._id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Course</span>
                  <span className="font-semibold text-dark">{order.course.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="font-bold text-primary">${order.amount}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-300">
                  <span className="text-gray-600">Status</span>
                  <span className="inline-block px-3 py-1 bg-green-100 text-accent rounded-full text-sm font-semibold capitalize">
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border-l-4 border-primary p-6 mb-8 text-left">
            <h3 className="font-bold text-dark mb-2">What's Next?</h3>
            <ul className="text-gray-600 space-y-2 text-sm">
              <li>✓ Check your email for an order confirmation</li>
              <li>✓ Access the course materials immediately</li>
              <li>✓ Track your progress on your dashboard</li>
              <li>✓ Download course resources anytime</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition font-semibold flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="flex-1 px-6 py-3 bg-light border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition font-semibold"
            >
              Browse More Courses
            </button>
          </div>

          {/* Support */}
          <p className="text-gray-600 text-sm mt-8">
            Need help? <a href="mailto:support@courseplatform.com" className="text-primary hover:underline">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
