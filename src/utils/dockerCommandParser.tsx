interface DockerRunOptions {
  name?: string;
  ports: string[];
  image: string;
  detach: boolean;
}

export const parseDockerRunCommand = (command: string): DockerRunOptions | null => {
  const parts = command.trim().split(' ');
  
  // docker run 명령어가 아닌 경우 null 반환
  if (parts[0] !== 'docker' || parts[1] !== 'run') {
    return null;
  }

  const options: DockerRunOptions = {
    ports: [],
    image: parts[parts.length - 1],
    detach: false
  };

  // 옵션 파싱
  for (let i = 2; i < parts.length - 1; i++) {
    switch (parts[i]) {
      case '-d':
      case '--detach':
        options.detach = true;
        break;
      case '--name':
        if (i + 1 < parts.length - 1) {
          options.name = parts[i + 1];
          i++;
        }
        break;
      case '-p':
      case '--publish':
        if (i + 1 < parts.length - 1) {
          options.ports.push(parts[i + 1]);
          i++;
        }
        break;
    }
  }

  return options;
};

// 사용 예시:
// const command = 'docker run -d --name my-nginx -p 8080:80 nginx';
// const options = parseDockerRunCommand(command);
// console.log(options);
// {
//   name: 'my-nginx',
//   ports: ['8080:80'],
//   image: 'nginx',
//   detach: true
// } 