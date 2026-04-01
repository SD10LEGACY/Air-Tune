import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#000080] text-white font-mono p-8 flex flex-col gap-4">
          <div className="bg-white text-[#000080] px-4 py-1 self-start font-bold">
            Windows
          </div>
          <p className="mt-8">A fatal exception has occurred at 0028:C0011E36 in VXD VMM(01) + 00010E36. The current application will be terminated.</p>
          <p className="mt-4">Error Details: {this.state.error?.message}</p>
          <ul className="list-disc list-inside mt-4">
            <li>Press any key to terminate the current application.</li>
            <li>Press CTRL+ALT+DEL again to restart your computer. You will lose any unsaved information in all applications.</li>
          </ul>
          <p className="mt-auto text-center">Press any key to continue _</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-white text-[#000080] px-4 py-1 self-center hover:bg-gray-200"
          >
            RESTART SYSTEM
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
