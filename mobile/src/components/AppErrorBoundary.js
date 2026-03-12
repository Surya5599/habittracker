import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { reportError } from '../lib/errorReporting';

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected application error.'
    };
  }

  componentDidCatch(error, errorInfo) {
    // Keep logging concise and non-fatal for production fallback UX.
    reportError(error, { scope: 'error-boundary', componentStack: errorInfo?.componentStack || '' });
    console.error('AppErrorBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={tw`flex-1 bg-[#0b0b0b] items-center justify-center px-6`}>
        <View style={tw`w-full max-w-sm rounded-2xl border-2 border-white bg-black p-5`}>
          <Text style={tw`text-white text-lg font-black uppercase tracking-widest`}>Something went wrong</Text>
          <Text style={tw`mt-3 text-gray-300 text-sm font-bold`}>
            The app hit an unexpected state. You can retry without losing your account.
          </Text>
          <Text style={tw`mt-3 text-gray-500 text-xs`} numberOfLines={3}>
            {this.state.errorMessage}
          </Text>

          <TouchableOpacity
            onPress={this.handleRetry}
            style={tw`mt-5 rounded-xl border-2 border-white bg-white px-4 py-3 items-center`}
          >
            <Text style={tw`text-black font-black uppercase text-xs tracking-widest`}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
