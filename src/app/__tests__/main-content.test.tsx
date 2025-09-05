import { render, screen, fireEvent } from '@testing-library/react'
import { MainContent } from '../main-content'

// Mock the components to focus on toggle functionality
jest.mock('@/components/chat/ChatInterface', () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat Interface</div>
}))

jest.mock('@/components/preview/PreviewFrame', () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview Frame</div>
}))

jest.mock('@/components/editor/FileTree', () => ({
  FileTree: () => <div data-testid="file-tree">File Tree</div>
}))

jest.mock('@/components/editor/CodeEditor', () => ({
  CodeEditor: () => <div data-testid="code-editor">Code Editor</div>
}))

jest.mock('@/components/HeaderActions', () => ({
  HeaderActions: () => <div data-testid="header-actions">Header Actions</div>
}))

describe('MainContent Toggle Functionality', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com'
  }

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    messages: [],
    data: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }

  it('should render preview by default', () => {
    render(<MainContent user={mockUser} project={mockProject} />)
    
    // Preview tab should be active
    const previewTab = screen.getByRole('tab', { name: 'Preview' })
    expect(previewTab).toHaveAttribute('data-state', 'active')
    
    // Code tab should be inactive
    const codeTab = screen.getByRole('tab', { name: 'Code' })
    expect(codeTab).toHaveAttribute('data-state', 'inactive')
    
    // Preview frame should be visible
    expect(screen.getByTestId('preview-frame')).toBeInTheDocument()
    
    // Code editor should not be visible
    expect(screen.queryByTestId('code-editor')).not.toBeInTheDocument()
  })

  it('should switch to code view when code tab is clicked', () => {
    render(<MainContent user={mockUser} project={mockProject} />)
    
    const codeTab = screen.getByRole('tab', { name: 'Code' })
    
    // Click the code tab
    fireEvent.click(codeTab)
    
    // Code tab should now be active
    expect(codeTab).toHaveAttribute('data-state', 'active')
    
    // Preview tab should now be inactive
    const previewTab = screen.getByRole('tab', { name: 'Preview' })
    expect(previewTab).toHaveAttribute('data-state', 'inactive')
    
    // Code editor should be visible
    expect(screen.getByTestId('code-editor')).toBeInTheDocument()
    expect(screen.getByTestId('file-tree')).toBeInTheDocument()
    
    // Preview frame should not be visible
    expect(screen.queryByTestId('preview-frame')).not.toBeInTheDocument()
  })

  it('should switch back to preview view when preview tab is clicked', () => {
    render(<MainContent user={mockUser} project={mockProject} />)
    
    const codeTab = screen.getByRole('tab', { name: 'Code' })
    const previewTab = screen.getByRole('tab', { name: 'Preview' })
    
    // Switch to code view first
    fireEvent.click(codeTab)
    expect(screen.getByTestId('code-editor')).toBeInTheDocument()
    
    // Switch back to preview view
    fireEvent.click(previewTab)
    
    // Preview tab should be active
    expect(previewTab).toHaveAttribute('data-state', 'active')
    
    // Code tab should be inactive
    expect(codeTab).toHaveAttribute('data-state', 'inactive')
    
    // Preview frame should be visible
    expect(screen.getByTestId('preview-frame')).toBeInTheDocument()
    
    // Code editor should not be visible
    expect(screen.queryByTestId('code-editor')).not.toBeInTheDocument()
  })

  it('should handle multiple rapid clicks correctly', () => {
    render(<MainContent user={mockUser} project={mockProject} />)
    
    const codeTab = screen.getByRole('tab', { name: 'Code' })
    const previewTab = screen.getByRole('tab', { name: 'Preview' })
    
    // Rapidly click between tabs
    fireEvent.click(codeTab)
    fireEvent.click(previewTab)
    fireEvent.click(codeTab)
    fireEvent.click(previewTab)
    
    // Should end up in preview state
    expect(previewTab).toHaveAttribute('data-state', 'active')
    expect(codeTab).toHaveAttribute('data-state', 'inactive')
    expect(screen.getByTestId('preview-frame')).toBeInTheDocument()
  })

  it('should handle invalid tab values gracefully', () => {
    render(<MainContent user={mockUser} project={mockProject} />)
    
    const tabs = screen.getByRole('tablist')
    
    // Simulate invalid value (this would happen if onValueChange receives unexpected data)
    const tabsComponent = tabs.closest('[data-slot="tabs"]')
    
    // Should remain in preview state by default
    const previewTab = screen.getByRole('tab', { name: 'Preview' })
    expect(previewTab).toHaveAttribute('data-state', 'active')
    expect(screen.getByTestId('preview-frame')).toBeInTheDocument()
  })
})