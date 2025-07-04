import React from 'react';
import TerminalContainer from './TerminalContainer';

const DockerSimulationContainer: React.FC = () => {
  return (
    <div className="docker-simulation-page">
      <TerminalContainer />
    </div>
  );
};

export default DockerSimulationContainer; 