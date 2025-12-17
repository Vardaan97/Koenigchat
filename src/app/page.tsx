'use client';

import Link from 'next/link';
import { ChatWidget } from '@/components/chat/chat-widget';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              K
            </div>
            <span className="font-bold text-xl">Koenig Solutions</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/live"
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
            >
              Admin Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
            Microsoft Partner of the Year 2025
          </span>
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Transform Your IT Career with World-Class Training
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            729+ certification courses across Microsoft, AWS, Cisco, Oracle, and more. Live
            instructor-led training with guaranteed results.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
              Explore Courses
            </button>
            <button className="px-6 py-3 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition">
              Corporate Solutions
            </button>
          </div>
        </div>
      </section>

      {/* Course Categories */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Certifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Microsoft Azure', count: '150+ courses' },
              { name: 'AWS Cloud', count: '80+ courses' },
              { name: 'Cisco Networking', count: '60+ courses' },
              { name: 'Oracle Database', count: '45+ courses' },
              { name: 'Google Cloud', count: '40+ courses' },
              { name: 'Cybersecurity', count: '90+ courses' },
              { name: 'Power BI & Data', count: '35+ courses' },
              { name: 'DevOps & Agile', count: '50+ courses' },
            ].map((category) => (
              <div
                key={category.name}
                className="p-6 border rounded-xl hover:shadow-lg transition cursor-pointer"
              >
                <h3 className="font-semibold mb-1">{category.name}</h3>
                <p className="text-sm text-slate-500">{category.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '30+', label: 'Years of Excellence' },
              { value: '500K+', label: 'Professionals Trained' },
              { value: '729+', label: 'Certification Courses' },
              { value: '98%', label: 'Customer Satisfaction' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl font-bold mb-2">{stat.value}</p>
                <p className="text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Courses</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'AZ-104: Microsoft Azure Administrator',
                vendor: 'Microsoft',
                duration: '32 hours',
                price: '€1,950',
              },
              {
                title: 'AWS Solutions Architect Associate',
                vendor: 'AWS',
                duration: '40 hours',
                price: '€1,800',
              },
              {
                title: 'PL-300: Power BI Data Analyst',
                vendor: 'Microsoft',
                duration: '24 hours',
                price: '€1,550',
              },
            ].map((course) => (
              <div key={course.title} className="border rounded-xl overflow-hidden hover:shadow-lg transition">
                <div className="h-40 bg-gradient-to-br from-blue-600 to-blue-400" />
                <div className="p-6">
                  <span className="text-xs font-medium text-blue-600">{course.vendor}</span>
                  <h3 className="font-semibold mt-1 mb-2">{course.title}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{course.duration}</span>
                    <span className="font-semibold">{course.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
          <p className="text-lg text-white/80 mb-8">
            Chat with our AI assistant or speak to a training advisor today
          </p>
          <p className="text-sm text-white/60">
            Click the chat icon in the bottom right corner to get started
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-slate-900 text-slate-400 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2025 Koenig Solutions. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/live" className="hover:text-white transition">
              Admin Dashboard
            </Link>
            <Link href="/demo" className="hover:text-white transition">
              Demo Page
            </Link>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget
        config={{
          position: 'bottom-right',
          primaryColor: '#2563EB',
          greeting:
            'Hi! Welcome to Koenig Solutions. How can I help you find the right IT training course today?',
          agentName: 'Koenig Assistant',
          companyName: 'Koenig Solutions',
          placeholder: 'Type your message...',
          collectEmail: true,
        }}
        pageContext={{
          url: typeof window !== 'undefined' ? window.location.href : '',
          title: 'Koenig Solutions - IT Training',
          type: 'home',
        }}
      />
    </div>
  );
}
