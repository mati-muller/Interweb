import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  to?: string;
  label?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  to = '/', 
  label = 'Volver', 
  style = {},
  onClick 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(to);
    }
  };

  const defaultStyle: React.CSSProperties = {
    background: '#c8a165',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 22px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    margin: '10px 0',
    ...style
  };

  return (
    <button
      onClick={handleClick}
      style={defaultStyle}
    >
      {label}
    </button>
  );
};

export default BackButton;