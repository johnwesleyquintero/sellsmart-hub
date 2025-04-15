import { Component } from 'react';
export class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Error Boundary caught:', error, errorInfo);
    }
    render() {
        var _a;
        if (this.state.hasError) {
            return (this.props.fallback || (<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-600 font-medium">Data Rendering Error</h3>
            <p className="text-red-500 text-sm mt-2">
              {((_a = this.state.error) === null || _a === void 0 ? void 0 : _a.message) ||
                    'Failed to render data visualization'}
            </p>
          </div>));
        }
        return this.props.children;
    }
}
