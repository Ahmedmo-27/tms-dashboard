import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      API_URL: process.env.NEXT_PUBLIC_TMS_API_URL,
      NODE_ENV: process.env.NODE_ENV,
      hasAxios: typeof require !== 'undefined',
      timestamp: new Date().toISOString()
    };
    
    console.log('API Test Config:', config);
    
    return NextResponse.json({
      success: true,
      config,
      message: 'Configuration test successful'
    });
  } catch (error) {
    console.error('API Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Configuration test failed'
    }, { status: 500 });
  }
}
