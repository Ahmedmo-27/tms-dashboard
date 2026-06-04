import { NextResponse } from 'next/server';
import { tms } from '@/lib/tms-api';

export async function POST(request: Request) {
  try {
    const { phoneNumber, password } = await request.json();
    
    console.log('Test login attempt:', { phoneNumber, hasPassword: !!password });
    
    // Test the axios configuration directly
    const response = await tms.post("/auth/login", {
      phoneNumber,
      password,
    });
    
    console.log('Test login response:', response.status);
    
    return NextResponse.json({
      success: true,
      data: response.data,
      message: 'Login test successful'
    });
  } catch (error) {
    console.error('Test login error:', {
      message: error.message,
      type: error.constructor.name,
      context: error.context || 'No context',
      stack: error.stack
    });
    
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        type: error.constructor.name,
        context: error.context || 'No context'
      },
      message: 'Login test failed'
    }, { status: 500 });
  }
}
